/* eslint-disable @typescript-eslint/class-methods-use-this */

/* eslint-disable @typescript-eslint/unbound-method */
import { faker as defaultFaker, type Faker } from "@faker-js/faker";
import RandExp from "randexp";
import * as v from "valibot";

type Optional<T, K extends keyof T> = Omit<T, K> & Pick<Partial<T>, K>;

type GenericPipe = [v.GenericSchema, ...v.GenericPipeItem[]];

type GenericSchemaWithPipe = v.SchemaWithPipe<GenericPipe>;

type GenericPipeAsync = [v.GenericSchema | v.GenericSchemaAsync, ...Array<v.GenericPipeItem | v.GenericPipeItemAsync>];

type GenericSchemaWithPipeAsync = v.SchemaWithPipeAsync<GenericPipeAsync>;

type SyncSchema = GenericSchemaWithPipe | v.GenericSchema;

type Schema = GenericSchemaWithPipe | GenericSchemaWithPipeAsync | v.GenericSchema | v.GenericSchemaAsync;

type SchemaMaybeWithPipe<TSchema extends v.GenericSchema | v.GenericSchemaAsync> = Optional<
  TSchema extends v.GenericSchema
    ? v.SchemaWithPipe<[TSchema, ...v.GenericPipeItem[]]>
    : v.SchemaWithPipeAsync<[TSchema, ...Array<v.GenericPipeItem | v.GenericPipeItemAsync>]>,
  `pipe`
>;

export class MockError extends Error {
  constructor(public typeName?: string) {
    super(`Unable to generate a mock value for schema ${typeName}.`);
  }
}

export type FakerFunction = (...args: unknown[]) => Date | boolean | number | string;

export type MockeryMapper = (keyName: string, fakerInstance: Faker) => FakerFunction | undefined;

export interface ValimockOptions {
  /**
   * Faker class instance for mocking
   */
  faker: Faker;

  /**
   * Set a seed for random generation
   */
  seed?: number[] | number;

  /**
   * Set to true to throw an exception instead of returning undefined when encountering an unknown Schema type
   */
  throwOnUnknownType: boolean;

  /**
   * Note: callback functions are not called with any
   * parameters at this time.
   */
  stringMap?: Record<string, (...args: any[]) => string>;

  /**
   * This is a function that can be provided to match a key name with a specific mock
   * Otherwise it searches the faker library for a matching function name
   */
  mockeryMapper: MockeryMapper;

  /**
   * This is a mapping of field name to mock generator function.
   * This mapping can be used to provide backup mock
   * functions for Schema types not yet implemented.
   *
   * The functions in this map will only be used if this library
   * is unable to find an appropriate mocking function to use.
   */
  customMocks: Record<string, (schema: v.GenericSchema | v.GenericSchemaAsync, options?: ValimockOptions) => unknown>;

  /**
   * How many entries to create for records
   */
  recordKeysLength: number;

  /**
   * How many entries to create for Maps
   */
  mapEntriesLength: number;
}

export class Valimock {
  options: ValimockOptions = {
    faker: defaultFaker,
    seed: undefined,
    throwOnUnknownType: false,
    stringMap: undefined,
    recordKeysLength: 1,
    mapEntriesLength: 1,
    customMocks: {},
    mockeryMapper: (keyName: string | undefined, fakerInstance: Faker): FakerFunction | undefined => {
      const keyToFnMap: Record<string, FakerFunction> = {
        image: fakerInstance.image.url,
        imageurl: fakerInstance.image.url,
        number: fakerInstance.number.int,
        float: fakerInstance.number.float,
        hexadecimal: fakerInstance.number.hex,
        uuid: fakerInstance.string.uuid,
        boolean: fakerInstance.datatype.boolean,
        city: fakerInstance.location.city
      };

      if (typeof keyName === `string` && keyName.toLowerCase() in keyToFnMap) {
        return keyToFnMap[keyName.toLowerCase()];
      }
    }
  };

  #stringGenerators: Record<string, FakerFunction> = {
    default: (length: number): string =>
      length > 10 ? this.options.faker.lorem.word() : this.options.faker.lorem.word({ length }),
    email: this.options.faker.internet.exampleEmail,
    uuid: this.options.faker.string.uuid,
    uid: this.options.faker.string.uuid,
    url: this.options.faker.internet.url,
    name: this.options.faker.person.fullName,
    date: (): string => this.options.faker.date.recent().toISOString(),
    dateTime: (): string => this.options.faker.date.recent().toISOString(),
    digits: this.options.faker.string.numeric,
    colorHex: this.options.faker.color.rgb,
    color: this.options.faker.color.rgb,
    backgroundColor: this.options.faker.color.rgb,
    textShadow: this.options.faker.color.rgb,
    textColor: this.options.faker.color.rgb,
    textDecorationColor: this.options.faker.color.rgb,
    borderColor: this.options.faker.color.rgb,
    borderTopColor: this.options.faker.color.rgb,
    borderRightColor: this.options.faker.color.rgb,
    borderBottomColor: this.options.faker.color.rgb,
    borderLeftColor: this.options.faker.color.rgb,
    borderBlockStartColor: this.options.faker.color.rgb,
    borderBlockEndColor: this.options.faker.color.rgb,
    borderInlineStartColor: this.options.faker.color.rgb,
    borderInlineEndColor: this.options.faker.color.rgb,
    columnRuleColor: this.options.faker.color.rgb,
    outlineColor: this.options.faker.color.rgb,
    phoneNumber: this.options.faker.phone.number,
    username: this.options.faker.internet.username
  };

  #stringValidations = {
    digits: this.options.faker.string.numeric,
    email: this.options.faker.internet.email,
    emoji: this.options.faker.internet.emoji,
    imei: this.options.faker.phone.imei,
    ip: this.options.faker.internet.ip,
    ipv4: this.options.faker.internet.ipv4,
    ipv6: this.options.faker.internet.ipv6,
    uuid: this.options.faker.string.uuid,
    url: this.options.faker.internet.url
  };

  constructor(options?: Partial<ValimockOptions>) {
    Object.assign(this.options, options);
  }

  #getChecks = ([_, ...pipe]: GenericPipe | GenericPipeAsync | []): Record<string, string | null> => {
    const isValidation = (val: unknown): val is v.GenericValidation =>
      typeof val === `object` &&
      val !== null &&
      `kind` in val &&
      typeof val.kind === `string` &&
      val.kind === `validation`;

    return Object.fromEntries(
      (pipe as Array<v.GenericPipeItem | v.GenericPipeItemAsync>).reduce<Array<[key: string, expects: string | null]>>(
        (arr, item) => {
          if (isValidation(item)) {
            arr.push([item.type, item.expects]);
          }
          return arr;
        },
        []
      )
    );
  };

  #getValidEnumValues = (obj: v.Enum): Array<number | string> =>
    Object.values(
      Object.entries(obj).reduce(
        (hash, [key, value]) => (typeof obj[value] === `number` ? hash : Object.assign(hash, { [key]: value })),
        {}
      )
    );

  #findMatchingFaker = (keyName?: string): FakerFunction | undefined => {
    if (typeof keyName === `undefined`) return;
    const lowerCaseKeyName = keyName.toLowerCase();
    const withoutDashesUnderscores = lowerCaseKeyName.replace(/_|-/g, ``);
    let fnName: string | undefined;

    const mapped = this.options.mockeryMapper(keyName, this.options.faker);
    if (mapped) return mapped;

    const sectionName = Object.keys(this.options.faker).find((sectionKey) =>
      Object.keys(this.options.faker[sectionKey as keyof Faker]).find((fnKey) => {
        const lower = fnKey.toLowerCase();
        fnName = lower === lowerCaseKeyName || lower === withoutDashesUnderscores ? keyName : undefined;

        if (fnName) {
          const fn = this.options.faker[sectionKey as keyof Faker][fnName as keyof Faker[keyof Faker]];

          if (typeof fn === `function`) {
            try {
              // @ts-expect-error
              const mock = fn();
              return typeof mock === `string` ||
                typeof mock === `number` ||
                typeof mock === `boolean` ||
                mock instanceof Date
                ? fnName
                : undefined;
            } catch {
              // do nothing. undefined will be returned eventually.
            }
          }
        }

        return undefined;
      })
    );
    if (sectionName && fnName) {
      const section = this.options.faker[sectionName];

      return section ? section[fnName as keyof typeof section] : undefined;
    }
  };

  mock = <T extends Schema>(schema: T): v.InferOutput<typeof schema> => this.#mock(schema);

  #mock = <T extends Schema>(schema: T, keyName?: string): v.InferOutput<typeof schema> => {
    try {
      if (this.options.seed) this.options.faker.seed(this.options.seed);
      if (
        v.isOfType<`string`, Schema | SchemaMaybeWithPipe<v.StringSchema<v.ErrorMessage<v.StringIssue> | undefined>>>(
          `string`,
          schema
        )
      ) {
        return this.#mockString(schema, keyName);
      }
      if (Object.keys(this.#schemas).includes(schema.type)) {
        return this.#schemas[schema.type](schema);
      }
      if (Object.keys(this.options.customMocks).includes(schema.type)) {
        return this.options.customMocks[schema.type](schema, this.options);
      }
      if (this.options.throwOnUnknownType) {
        throw new MockError(schema.type);
      }
    } catch (err) {
      if (err instanceof MockError) {
        throw err;
      }

      console.error(err);
    }
  };

  #mockArray = <
    TSchema extends
      | v.ArraySchema<SyncSchema, v.ErrorMessage<v.ArrayIssue> | undefined>
      | v.ArraySchemaAsync<Schema, v.ErrorMessage<v.ArrayIssue> | undefined> =
      | v.ArraySchema<SyncSchema, v.ErrorMessage<v.ArrayIssue> | undefined>
      | v.ArraySchemaAsync<Schema, v.ErrorMessage<v.ArrayIssue> | undefined>
  >(
    schema: SchemaMaybeWithPipe<TSchema>
  ): v.InferOutput<TSchema> => {
    const checks = this.#getChecks(schema.pipe ?? []);
    let min = checks.min_length ? parseInt(checks.min_length.replace(`>=`, ``), 10) : 1;
    const max = checks.max_length ? parseInt(checks.max_length.replace(`<=`, ``), 10) : 5;

    if (min > max) {
      min = max;
    }

    return Array.from<undefined, v.InferOutput<TSchema>>(
      {
        length: checks.length
          ? parseInt(checks.length, 10)
          : this.options.faker.number.int({
              min,
              max
            })
      },
      () => this.#mock(schema.item)
    );
  };

  #mockBigint = (
    schema: SchemaMaybeWithPipe<v.BigintSchema<v.ErrorMessage<v.BigintIssue> | undefined>>
  ): v.InferOutput<typeof schema> => {
    const checks = this.#getChecks(schema.pipe ?? [schema]);

    return checks.value
      ? BigInt(checks.value)
      : this.options.faker.number.bigInt({
          min: checks.min_value ? BigInt(checks.min_value.replace(`>=`, ``)) : undefined,
          max: checks.max_value ? BigInt(checks.max_value.replace(`<=`, ``)) : undefined
        });
  };

  #mockBoolean = (
    schema: SchemaMaybeWithPipe<v.BooleanSchema<v.ErrorMessage<v.BooleanIssue> | undefined>>
  ): v.InferOutput<typeof schema> => this.options.faker.datatype.boolean();

  #mockDate = (
    schema: SchemaMaybeWithPipe<v.DateSchema<v.ErrorMessage<v.DateIssue> | undefined>>
  ): v.InferOutput<typeof schema> => {
    const checks = this.#getChecks(schema.pipe ?? []);

    if (checks.value) {
      return new Date(checks.value);
    }

    const bounds = {
      min: checks.min_value ? new Date(checks.min_value.replace(`>=`, ``)) : undefined,
      max: checks.max_value ? new Date(checks.max_value.replace(`<=`, ``)) : undefined
    };

    let result = this.options.faker.date.soon();

    if (bounds.min instanceof Date && bounds.max instanceof Date) {
      result = this.options.faker.date.between({
        from: bounds.min,
        to: bounds.max
      });
    }
    if (bounds.min instanceof Date && typeof bounds.max === `undefined`) {
      result = this.options.faker.date.soon({ refDate: bounds.min });
    }
    if (typeof bounds.min === `undefined` && bounds.max instanceof Date) {
      result = this.options.faker.date.recent({ refDate: bounds.max });
    }

    return result;
  };

  #mockPicklist = (
    schema: v.PicklistSchema<v.PicklistOptions, v.ErrorMessage<v.PicklistIssue> | undefined>
  ): v.InferOutput<typeof schema> => this.options.faker.helpers.arrayElement(schema.options);

  #mockIntersect = (
    schema: v.IntersectSchema<v.IntersectOptions, v.ErrorMessage<v.IntersectIssue> | undefined>
  ): v.InferOutput<typeof schema> =>
    schema.options.reduce(
      (hash, entry) => Object.assign(hash, this.#mock(entry)),
      // @ts-expect-error
      {}
    ) as v.InferOutput<typeof schema>;

  #mockLiteral = (
    schema: v.LiteralSchema<v.Literal, v.ErrorMessage<v.LiteralIssue> | undefined>
  ): v.InferOutput<typeof schema> => schema.literal;

  #mockMap = (
    schema:
      | v.MapSchema<SyncSchema, SyncSchema, v.ErrorMessage<v.MapIssue> | undefined>
      | v.MapSchemaAsync<Schema, Schema, v.ErrorMessage<v.MapIssue> | undefined>
  ): v.InferOutput<typeof schema> => {
    const result = new Map<unknown, unknown>();
    while (result.size < this.options.mapEntriesLength) {
      result.set(this.#mock(schema.key), this.#mock(schema.value));
    }
    return result;
  };

  #mockNaN = (schema: v.NanSchema<v.ErrorMessage<v.NanIssue> | undefined>): v.InferOutput<typeof schema> => NaN;

  #mockEnum = (schema: v.EnumSchema<v.Enum, v.ErrorMessage<v.EnumIssue> | undefined>): v.InferOutput<typeof schema> =>
    this.options.faker.helpers.arrayElement(this.#getValidEnumValues(schema.enum));

  #mockRequired = (
    schema:
      | v.NonNullableSchema<SyncSchema, v.ErrorMessage<v.NonNullableIssue> | undefined>
      | v.NonNullableSchemaAsync<Schema, v.ErrorMessage<v.NonNullableIssue> | undefined>
      | v.NonNullishSchema<SyncSchema, v.ErrorMessage<v.NonNullishIssue> | undefined>
      | v.NonNullishSchemaAsync<Schema, v.ErrorMessage<v.NonNullishIssue> | undefined>
      | v.NonOptionalSchema<SyncSchema, v.ErrorMessage<v.NonOptionalIssue> | undefined>
      | v.NonOptionalSchemaAsync<Schema, v.ErrorMessage<v.NonOptionalIssue> | undefined>
  ): v.InferOutput<typeof schema> => this.#mock(schema.wrapped);

  #mockNullable = (
    schema: v.NullableSchema<SyncSchema, SyncSchema> | v.NullableSchemaAsync<Schema, Schema>
  ): v.InferOutput<typeof schema> => this.options.faker.helpers.arrayElement([this.#mock(schema.wrapped), null]);

  #mockNullish = (
    schema: v.NullishSchema<SyncSchema, SyncSchema> | v.NullishSchemaAsync<Schema, Schema>
  ): v.InferOutput<typeof schema> =>
    this.options.faker.helpers.arrayElement([this.#mock(schema.wrapped), null, undefined]) ??
    schema.default ??
    this.options.faker.helpers.arrayElement([null, undefined]);

  #mockNull = (schema: v.NullSchema<v.ErrorMessage<v.NullIssue> | undefined>): v.InferOutput<typeof schema> => null;

  #mockNumber = (
    schema: SchemaMaybeWithPipe<v.NumberSchema<v.ErrorMessage<v.NumberIssue> | undefined>>
  ): v.InferOutput<typeof schema> => {
    const checks = this.#getChecks(schema.pipe ?? []);

    const isInteger = `integer` in checks;
    const bounds = {
      min: checks.min_value ? Number(checks.min_value.replace(`>=`, ``)) : 0,
      max: checks.max_value
        ? Number(checks.max_value.replace(`<=`, ``))
        : checks.min_value
          ? Number(checks.min_value.replace(`>=`, ``)) + 1
          : 5
    };

    return checks.value
      ? Number(checks.value)
      : isInteger
        ? this.options.faker.number.int(bounds)
        : this.options.faker.number.float(bounds);
  };

  #mockObject = (
    schema:
      | v.ObjectSchema<v.ObjectEntries, v.ErrorMessage<v.ObjectIssue> | undefined>
      | v.ObjectSchemaAsync<v.ObjectEntriesAsync, v.ErrorMessage<v.ObjectIssue> | undefined>
  ): v.InferOutput<typeof schema> =>
    Object.entries(schema.entries).reduce<Record<string, v.GenericSchema>>(
      (hash, [key, value]) => ({
        ...hash,
        [key]: this.#mock<Schema>(value, key)
      }),
      {}
    );

  #mockOptional = (
    schema: v.OptionalSchema<SyncSchema, SyncSchema> | v.OptionalSchemaAsync<Schema, Schema>
  ): v.InferOutput<typeof schema> =>
    this.options.faker.helpers.arrayElement([
      this.#mock<v.GenericSchema | v.GenericSchemaAsync>(schema.wrapped),

      undefined
    ]) ?? schema.default;

  #mockRecord = <
    Key extends v.BaseSchema<string, number | string | symbol, v.BaseIssue<unknown>> = v.BaseSchema<
      string,
      number | string | symbol,
      v.BaseIssue<unknown>
    >,
    Value extends Schema = Schema
  >(
    schema: Value extends v.GenericSchema
      ? v.RecordSchema<Key, Value, v.ErrorMessage<v.RecordIssue> | undefined>
      : v.RecordSchemaAsync<Key, Value, v.ErrorMessage<v.RecordIssue> | undefined>
  ): v.InferOutput<typeof schema> =>
    Object.fromEntries(
      Array.from({ length: this.options.recordKeysLength }, () => [this.#mock(schema.key), this.#mock(schema.value)])
    ) as v.InferOutput<typeof schema>;

  #mockRecursive =
    (schema: v.LazySchema<v.GenericSchema> | v.LazySchemaAsync<v.GenericSchema | v.GenericSchemaAsync>) =>
    async (input: v.InferInput<typeof schema>): Promise<v.InferOutput<typeof schema>> =>
      this.#mock(await schema.getter(input));

  #mockSet = <
    TSchema extends
      | v.SetSchema<SyncSchema, v.ErrorMessage<v.SetIssue> | undefined>
      | v.SetSchemaAsync<Schema, v.ErrorMessage<v.SetIssue> | undefined> =
      | v.SetSchema<SyncSchema, v.ErrorMessage<v.SetIssue> | undefined>
      | v.SetSchemaAsync<Schema, v.ErrorMessage<v.SetIssue> | undefined>
  >(
    schema: SchemaMaybeWithPipe<TSchema>
  ): v.InferOutput<TSchema> => {
    const checks = this.#getChecks(schema.pipe ?? []);
    const fixed = checks.size ? Number(checks.size) : null;
    let min = checks.min_size ? Number(checks.min_size.replace(`>=`, ``)) : 1;
    const max = checks.max_size ? Number(checks.max_size.replace(`<=`, ``)) : 5;
    if (min > max) {
      min = max;
    }
    const targetLength =
      fixed ??
      this.options.faker.number.int({
        min,
        max
      });
    const result = new Set<Schema>();
    while (result.size < targetLength) {
      result.add(this.#mock(schema.value));
    }
    return result;
  };

  #mockString = (
    schema: SchemaMaybeWithPipe<v.StringSchema<v.ErrorMessage<v.StringIssue> | undefined>>,
    keyName?: string
  ): v.InferOutput<typeof schema> => {
    const checks = this.#getChecks(schema.pipe ?? []); //?
    const bounds = {
      min: checks.min_length ? Number(checks.min_length.replace(`>=`, ``)) : 0,
      max: checks.max_length ? Number(checks.max_length.replace(`<=`, ``)) : undefined
    };

    if (bounds.min && bounds.max && bounds.min > bounds.max) {
      const temp = bounds.min;
      bounds.min = bounds.max;
      bounds.max = temp;
    }

    if (checks.length) {
      checks; //?
      bounds.min = Number(checks.length);
      bounds.max = Number(checks.length);
    }

    const targetStringLength = this.options.faker.number.int(bounds);

    // First, check to see if we have a supported validation
    const supportedValidation = Object.keys(checks).find((key) => Object.keys(this.#stringValidations).includes(key));
    if (typeof supportedValidation === `string`) {
      supportedValidation; //?
      return this.#stringValidations[supportedValidation]({ length: bounds });
    }

    // Next, try to match a supplied Regular Expression
    const regexCheck = schema.pipe?.find((check) => check.kind === `validation` || check.type === `regex`);
    if (regexCheck && `requirement` in regexCheck && regexCheck.requirement instanceof RegExp) {
      const generator = new RandExp(regexCheck.requirement);
      generator.randInt = (min: number, max: number): number =>
        this.options.faker.number.int({
          min,
          max
        });
      generator.max = bounds.max;
      return generator.gen();
    }

    // Then try to match to a user-defined custom string
    const lowerCaseKeyName = keyName?.toLowerCase();
    if (keyName && this.options.stringMap?.[keyName]) {
      return this.options.stringMap[keyName]({ length: bounds });
    }

    // If all else fails, we'll either try to match based on the
    // key name (if the string is inside an object) or default to
    // some Lorem Ipsum
    const stringType =
      Object.keys(this.#stringGenerators).find(
        (genKey) =>
          genKey.toLowerCase() === lowerCaseKeyName ||
          schema.pipe?.find((item) => typeof item.type === `string` && item.type.toUpperCase() === genKey.toUpperCase())
      ) ?? null;

    const foundFaker = this.#findMatchingFaker(keyName);
    const generator: FakerFunction = stringType
      ? this.#stringGenerators[stringType]
      : (foundFaker ?? this.#stringGenerators.default);
    generator.name;

    let val = generator().toString();
    const delta = targetStringLength - val.length;
    if (typeof bounds.min === `number` && val.length < bounds.min) {
      val += this.options.faker.string.alpha(delta);
    }

    return val.slice(0, bounds.max);
  };

  #mockTuple = (
    schema:
      | v.TupleSchema<v.TupleItems, v.ErrorMessage<v.TupleIssue> | undefined>
      | v.TupleSchemaAsync<v.TupleItemsAsync, v.ErrorMessage<v.TupleIssue> | undefined>
  ): v.InferOutput<typeof schema> => schema.items.map((item) => this.#mock(item));

  #mockUnion = (
    schema:
      | v.UnionSchema<v.UnionOptions, v.ErrorMessage<v.UnionIssue<v.BaseIssue<unknown>>> | undefined>
      | v.UnionSchemaAsync<
          v.UnionOptions | v.UnionOptionsAsync,
          v.ErrorMessage<v.UnionIssue<v.BaseIssue<unknown>>> | undefined
        >
  ): v.InferOutput<typeof schema> => this.#mock(this.options.faker.helpers.arrayElement([...schema.options]));

  #mockUndefined = (
    schema: v.UndefinedSchema<v.ErrorMessage<v.UndefinedIssue> | undefined>
  ): v.InferOutput<typeof schema> => undefined;

  #schemas = {
    array: this.#mockArray,
    bigint: this.#mockBigint,
    boolean: this.#mockBoolean,
    date: this.#mockDate,
    enum: this.#mockEnum,
    intersect: this.#mockIntersect,
    literal: this.#mockLiteral,
    map: this.#mockMap,
    nan: this.#mockNaN,
    non_nullable: this.#mockRequired,
    non_nullish: this.#mockRequired,
    non_optional: this.#mockRequired,
    nullable: this.#mockNullable,
    nullish: this.#mockNullish,
    null: this.#mockNull,
    number: this.#mockNumber,
    object: this.#mockObject,
    optional: this.#mockOptional,
    picklist: this.#mockPicklist,
    record: this.#mockRecord,
    recursive: this.#mockRecursive,
    set: this.#mockSet,
    string: this.#mockString,
    tuple: this.#mockTuple,
    union: this.#mockUnion,
    undefined: this.#mockUndefined
  };
}
