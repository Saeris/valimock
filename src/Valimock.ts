/* eslint-disable @typescript-eslint/unbound-method */
import { faker as defaultFaker, type Faker } from "@faker-js/faker";
import RandExp from "randexp";
import type * as v from "valibot";

export class MockError extends Error {
  constructor(public typeName?: string) {
    super(`Unable to generate a mock value for schema ${typeName}.`);
  }
}

export type FakerFunction = (
  ...args: unknown[]
) => Date | boolean | number | string;

export type MockeryMapper = (
  keyName: string,
  fakerInstance: Faker
) => FakerFunction | undefined;

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
  customMocks: Record<
    string,
    (
      schema: v.BaseSchema | v.BaseSchemaAsync,
      options?: ValimockOptions
    ) => unknown
  >;

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
    // eslint-disable-next-line no-undefined
    seed: undefined,
    throwOnUnknownType: false,
    // eslint-disable-next-line no-undefined
    stringMap: undefined,
    recordKeysLength: 1,
    mapEntriesLength: 1,
    customMocks: {},
    // eslint-disable-next-line no-undefined
    mockeryMapper: (
      keyName: string | undefined,
      fakerInstance: Faker
    ): FakerFunction | undefined => {
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
      length > 10
        ? this.options.faker.lorem.word()
        : this.options.faker.lorem.word({ length }),
    email: this.options.faker.internet.exampleEmail,
    uuid: this.options.faker.string.uuid,
    uid: this.options.faker.string.uuid,
    url: this.options.faker.internet.url,
    name: this.options.faker.person.fullName,
    date: (): string => this.options.faker.date.recent().toISOString(),
    dateTime: (): string => this.options.faker.date.recent().toISOString(),
    colorHex: this.options.faker.internet.color,
    color: this.options.faker.internet.color,
    backgroundColor: this.options.faker.internet.color,
    textShadow: this.options.faker.internet.color,
    textColor: this.options.faker.internet.color,
    textDecorationColor: this.options.faker.internet.color,
    borderColor: this.options.faker.internet.color,
    borderTopColor: this.options.faker.internet.color,
    borderRightColor: this.options.faker.internet.color,
    borderBottomColor: this.options.faker.internet.color,
    borderLeftColor: this.options.faker.internet.color,
    borderBlockStartColor: this.options.faker.internet.color,
    borderBlockEndColor: this.options.faker.internet.color,
    borderInlineStartColor: this.options.faker.internet.color,
    borderInlineEndColor: this.options.faker.internet.color,
    columnRuleColor: this.options.faker.internet.color,
    outlineColor: this.options.faker.internet.color,
    phoneNumber: this.options.faker.phone.number
  };

  #stringValidations = {
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

  #getChecks = (
    pipe: v.Pipe<unknown> | v.PipeAsync<unknown> = []
  ): Record<string, unknown> => {
    const isValidation = (
      val: unknown
    ): val is v.BaseValidation<unknown> & {
      type: string;
      requirement: unknown;
    } =>
      typeof val === `object` &&
      val !== null &&
      `type` in val &&
      `requirement` in val &&
      `message` in val;

    return Object.fromEntries(
      [...pipe].reduce<Array<[key: string, requirement: unknown]>>(
        (arr, item) => {
          if (isValidation(item)) {
            arr.push([item.type, item.requirement]);
          }
          return arr;
        },
        []
      )
    );
  };

  #getValidEnumValues = <T extends v.Enum>(obj: T): Array<number | string> =>
    Object.values(
      Object.entries(obj).reduce(
        (hash, [key, value]) =>
          typeof obj[value] === `number`
            ? hash
            : Object.assign(hash, { [key]: value }),
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
      Object.keys(this.options.faker[sectionKey as keyof Faker]).find(
        (fnKey) => {
          const lower = fnKey.toLowerCase();
          fnName =
            lower === lowerCaseKeyName || lower === withoutDashesUnderscores
              ? keyName
              : // eslint-disable-next-line no-undefined
                undefined;

          if (fnName) {
            const fn =
              this.options.faker[sectionKey as keyof Faker][
                fnName as keyof Faker[keyof Faker]
              ];

            if (typeof fn === `function`) {
              try {
                // @ts-expect-error
                const mock = fn();
                return typeof mock === `string` ||
                  typeof mock === `number` ||
                  typeof mock === `boolean` ||
                  mock instanceof Date
                  ? fnName
                  : // eslint-disable-next-line no-undefined
                    undefined;
              } catch {
                // do nothing. undefined will be returned eventually.
              }
            }
          }
          // eslint-disable-next-line no-undefined
          return undefined;
        }
      )
    );
    if (sectionName && fnName) {
      const section = this.options.faker[sectionName];
      // eslint-disable-next-line no-undefined
      return section ? section[fnName as keyof typeof section] : undefined;
    }
  };

  mock = <T extends { type?: string } & (v.BaseSchema | v.BaseSchemaAsync)>(
    schema: T
  ): v.Output<typeof schema> => this.#mock(schema);

  #mock = <T extends { type?: string } & (v.BaseSchema | v.BaseSchemaAsync)>(
    schema: T,
    keyName?: string
  ): v.Output<typeof schema> => {
    try {
      if (this.options.seed) this.options.faker.seed(this.options.seed);
      if (`type` in schema && typeof schema.type === `string`) {
        if (Object.keys(this.#schemas).includes(schema.type)) {
          if (schema.type === `string`) {
            return this.#mockString(
              schema as v.StringSchema | v.StringSchemaAsync,
              keyName
            );
          }
          return this.#schemas[schema.type](schema);
        }
        if (Object.keys(this.options.customMocks).includes(schema.type)) {
          return this.options.customMocks[schema.type](schema, this.options);
        }
      }
      if (this.options.throwOnUnknownType) {
        throw new MockError(schema.type);
      }
    } catch (err) {
      if (err instanceof MockError) {
        throw err;
      }
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  #mockArray = (
    schema: v.ArraySchema<v.BaseSchema> | v.ArraySchemaAsync<v.BaseSchema>
  ): v.Output<typeof schema> => {
    const checks = this.#getChecks(schema.pipe);
    let min = (checks.min_length ?? 1) as number;
    const max = (checks.max_length ?? 5) as number;

    if (min > max) {
      min = max;
    }

    return Array.from<undefined, v.BaseSchema>(
      {
        length:
          typeof checks.length === `number`
            ? checks.length
            : this.options.faker.number.int({ min, max })
      },
      () => this.#mock(schema.item)
    );
  };

  #mockBigint = (
    schema: v.BigintSchema | v.BigintSchemaAsync
  ): v.Output<typeof schema> => {
    const checks = this.#getChecks(schema.pipe);

    return typeof checks.value === `number` || typeof checks.value === `bigint`
      ? BigInt(checks.value)
      : this.options.faker.number.bigInt({
          min: checks.min_value as number | undefined,
          max: checks.max_value as number | undefined
        });
  };

  #mockBoolean = (
    schema: v.BooleanSchema | v.BooleanSchemaAsync
  ): v.Output<typeof schema> => this.options.faker.datatype.boolean();

  #mockDate = (
    schema: v.DateSchema | v.DateSchemaAsync
  ): v.Output<typeof schema> => {
    const checks = this.#getChecks(schema.pipe);

    if (checks.value instanceof Date) {
      return checks.value;
    }

    const bounds = {
      min: checks.min_value as Date | undefined,
      max: checks.max_value as Date | undefined
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
    schema: v.PicklistSchema<v.PicklistOptions>
  ): v.Output<typeof schema> =>
    this.options.faker.helpers.arrayElement(schema.options);

  #mockIntersect = (
    schema: v.IntersectSchema<v.IntersectOptions>
  ): v.Output<typeof schema> =>
    schema.options.reduce(
      (hash, entry) => Object.assign(hash, this.#mock(entry)),
      {} as v.BaseSchema
    ) as v.Output<typeof schema>;

  #mockLiteral = (
    schema: v.LiteralSchema<v.Literal> | v.LiteralSchemaAsync<v.Literal>
  ): v.Output<typeof schema> => schema.literal;

  #mockMap = (
    schema:
      | v.MapSchema<v.BaseSchema, v.BaseSchema>
      | v.MapSchemaAsync<v.BaseSchema, v.BaseSchema>
  ): v.Output<typeof schema> => {
    const result = new Map<v.BaseSchema, v.BaseSchema>();
    while (result.size < this.options.mapEntriesLength) {
      result.set(this.#mock(schema.key), this.#mock(schema.value));
    }
    return result;
  };

  #mockNaN = (
    schema: v.NanSchema<unknown> | v.NanSchemaAsync<unknown>
  ): v.Output<typeof schema> => NaN;

  #mockEnum = (
    schema: v.EnumSchema<v.Enum> | v.EnumSchemaAsync<v.Enum>
  ): v.Output<typeof schema> =>
    this.options.faker.helpers.arrayElement(
      this.#getValidEnumValues(schema.enum)
    );

  #mockRequired = (
    schema:
      | v.NonNullableSchema<v.BaseSchema>
      | v.NonNullableSchemaAsync<v.BaseSchema>
      | v.NonNullishSchema<v.BaseSchema>
      | v.NonNullishSchemaAsync<v.BaseSchema>
      | v.NonOptionalSchema<v.BaseSchema>
      | v.NonOptionalSchemaAsync<v.BaseSchema>
  ): v.Output<typeof schema> => this.#mock(schema.wrapped);

  #mockNullable = (
    schema: v.NullableSchema<v.BaseSchema> | v.NullableSchemaAsync<v.BaseSchema>
  ): v.Output<typeof schema> =>
    this.options.faker.helpers.arrayElement([this.#mock(schema.wrapped), null]);

  #mockNullish = (
    schema: v.NullishSchema<v.BaseSchema> | v.NullishSchemaAsync<v.BaseSchema>
  ): v.Output<typeof schema> =>
    this.options.faker.helpers.arrayElement([
      this.#mock(schema.wrapped),
      null,
      // eslint-disable-next-line no-undefined
      undefined
    ]) ??
    schema.default ??
    // eslint-disable-next-line no-undefined
    this.options.faker.helpers.arrayElement([null, undefined]);

  #mockNull = (
    schema: v.NullSchema | v.NullSchemaAsync
  ): v.Output<typeof schema> => null;

  #mockNumber = (
    schema: v.NumberSchema | v.NumberSchemaAsync
  ): v.Output<typeof schema> => {
    const checks = this.#getChecks(schema.pipe);

    const isInteger = `integer` in checks;
    const bounds = {
      min: (checks.min_value as number | undefined) ?? 0,
      max:
        (checks.max_value as number | undefined) ??
        (typeof checks.min_value === `number` ? checks.min_value + 1 : 5)
    };

    return typeof checks.value === `number`
      ? checks.value
      : isInteger
        ? this.options.faker.number.int(bounds)
        : this.options.faker.number.float(bounds);
  };

  #mockObject = (
    schema:
      | v.ObjectSchema<v.ObjectEntries>
      | v.ObjectSchemaAsync<v.ObjectEntriesAsync>
  ): v.Output<typeof schema> =>
    Object.entries(schema.entries).reduce<Record<string, v.BaseSchema>>(
      (hash, [key, value]) => ({
        ...hash,
        [key]: this.#mock<v.BaseSchema | v.BaseSchemaAsync>(value, key)
      }),
      {}
    );

  #mockOptional = (
    schema: v.OptionalSchema<v.BaseSchema> | v.OptionalSchemaAsync<v.BaseSchema>
  ): v.Output<typeof schema> =>
    this.options.faker.helpers.arrayElement([
      this.#mock<v.BaseSchema>(schema.wrapped),
      // eslint-disable-next-line no-undefined
      undefined
    ]) ?? schema.default;

  #mockRecord = <
    Key extends v.RecordKey = v.RecordKey,
    Value extends v.BaseSchema = v.BaseSchema
  >(
    schema: v.RecordSchema<Key, Value> | v.RecordSchemaAsync<Key, Value>
  ): v.Output<typeof schema> =>
    Object.fromEntries(
      Array.from({ length: this.options.recordKeysLength }, () => [
        this.#mock(schema.key),
        this.#mock(schema.value)
      ])
    ) as v.Output<typeof schema>;

  #mockRecursive = (
    schema:
      | v.RecursiveSchema<() => v.BaseSchema>
      | v.RecursiveSchemaAsync<() => v.BaseSchema | v.BaseSchemaAsync>
  ): v.Output<typeof schema> => this.#mock(schema.getter());

  #mockSet = (
    schema: v.SetSchema<v.BaseSchema> | v.SetSchemaAsync<v.BaseSchemaAsync>
  ): v.Output<typeof schema> => {
    const checks = this.#getChecks(schema.pipe);
    const fixed = typeof checks.size === `number` ? checks.size : null;
    let min = typeof checks.min_size === `number` ? checks.min_size : 1;
    const max = typeof checks.max_size === `number` ? checks.max_size : 5;
    if (min > max) {
      min = max;
    }
    const targetLength = fixed ?? this.options.faker.number.int({ min, max });
    const result = new Set<v.BaseSchema | v.BaseSchemaAsync>();
    while (result.size < targetLength) {
      result.add(this.#mock(schema.value));
    }
    return result;
  };

  #mockString = (
    schema: v.StringSchema | v.StringSchemaAsync,
    keyName?: string
  ): v.Output<typeof schema> => {
    const checks = this.#getChecks(schema.pipe);
    const bounds = {
      min: (checks.min_length as number | undefined) ?? 0,
      max:
        (checks.max_length as number | undefined) ??
        (typeof checks.min_length === `number` ? checks.min_length + 1 : 5)
    };

    if (bounds.min && bounds.max && bounds.min > bounds.max) {
      const temp = bounds.min;
      bounds.min = bounds.max;
      bounds.max = temp;
    }

    if (typeof checks.length === `number`) {
      bounds.min = checks.length;
      bounds.max = checks.length;
    }

    const targetStringLength = this.options.faker.number.int(bounds);

    // First, check to see if we have a supported validation
    const supportedValidation = Object.keys(checks).find((key) =>
      Object.keys(this.#stringValidations).includes(key)
    );
    if (typeof supportedValidation === `string`) {
      return this.#stringValidations[supportedValidation]();
    }

    // Next, try to match a supplied Regular Expression
    const regexCheck = schema.pipe?.find(
      (check) =>
        (`requirement` in check && check.requirement instanceof RegExp) ||
        (`type` in check && check.type === `regex`)
    );
    if (
      regexCheck &&
      `requirement` in regexCheck &&
      (regexCheck.requirement instanceof RegExp ||
        typeof regexCheck.requirement === `string`)
    ) {
      const generator = new RandExp(regexCheck.requirement);
      generator.randInt = (min: number, max: number): number =>
        this.options.faker.number.int({ min, max });
      generator.max = bounds.max;
      return generator.gen();
    }

    // Then try to match to a user-defined custom string
    const lowerCaseKeyName = keyName?.toLowerCase();
    if (keyName && this.options.stringMap) {
      const generator = this.options.stringMap[keyName];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (generator) {
        return generator();
      }
    }

    // If all else fails, we'll either try to match based on the
    // key name (if the string is inside an object) or default to
    // some Lorem Ipsum
    const stringType =
      Object.keys(this.#stringGenerators).find(
        (genKey) =>
          genKey.toLowerCase() === lowerCaseKeyName ||
          schema.pipe?.find(
            (item) =>
              `type` in item &&
              typeof item.type === `string` &&
              item.type.toUpperCase() === genKey.toUpperCase()
          )
      ) ?? null;

    let generator: FakerFunction = this.#stringGenerators.default;

    if (stringType) {
      generator = this.#stringGenerators[stringType];
    } else {
      const foundFaker = this.#findMatchingFaker(keyName);
      if (foundFaker) {
        generator = foundFaker;
      }
    }

    let val = generator().toString();
    const delta = targetStringLength - val.length;
    if (typeof bounds.min === `number` && val.length < bounds.min) {
      val += this.options.faker.string.alpha(delta);
    }

    return val.slice(0, bounds.max);
  };

  #mockTuple = (
    schema: v.TupleSchema<v.TupleItems> | v.TupleSchemaAsync<v.TupleItemsAsync>
  ): v.Output<typeof schema> =>
    schema.items.map((item) => this.#mock(item)) as v.Output<typeof schema>;

  #mockUnion = (
    schema:
      | v.UnionSchema<v.UnionOptions>
      | v.UnionSchemaAsync<v.UnionOptions | v.UnionOptionsAsync>
  ): v.Output<typeof schema> =>
    this.#mock(this.options.faker.helpers.arrayElement([...schema.options]));

  #mockUndefined = (
    schema: v.UndefinedSchema | v.UndefinedSchemaAsync
  ): v.Output<typeof schema> =>
    // eslint-disable-next-line no-undefined
    undefined;

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
