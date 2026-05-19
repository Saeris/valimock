/* eslint-disable @typescript-eslint/class-methods-use-this */

/* eslint-disable @typescript-eslint/unbound-method */
import { faker as defaultFaker, type Faker } from "@faker-js/faker";
import * as v from "valibot";
import { generateNumber } from "./number/generateNumber.js";
import { generateString } from "./string/generateString.js";
import type {
  GenericPipe,
  GenericPipeAsync,
  Schema,
  SchemaMaybeWithPipe,
  SyncSchema,
  MaybeRequiredSchema,
  RequiredSchema
} from "./types.js";

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
   * @deprecated Will be removed in a future major. The string mocking pipeline now
   * resolves Faker methods directly from a property name and via the action
   * registry in `src/string/`. To extend mock generation, prefer adding entries
   * to `stringMap` or contributing an action handler upstream.
   *
   * When a `mockeryMapper` is provided, it is consulted before Faker auto-discovery
   * for backwards compatibility and a one-time deprecation warning is emitted.
   */
  mockeryMapper: MockeryMapper;

  /**
   * Sink for non-fatal diagnostic messages: unhandled Valibot actions, retry-budget
   * exhaustion, and previously silently swallowed errors from `#mock`. Defaults to
   * `console.warn`. Set to `() => {}` to silence.
   */
  onWarn: (message: string) => void;

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
    onWarn: (message: string): void => console.warn(`[valimock] ${message}`),
    mockeryMapper: (keyName: string | undefined, fakerInstance: Faker): FakerFunction | undefined => {
      const keyToFnMap: Record<string, FakerFunction> = {
        image: (): string => fakerInstance.image.url(),
        imageurl: (): string => fakerInstance.image.url(),
        number: (): number => fakerInstance.number.int(),
        float: (): number => fakerInstance.number.float(),
        hexadecimal: (): string => fakerInstance.number.hex(),
        uuid: (): string => fakerInstance.string.uuid(),
        boolean: (): boolean => fakerInstance.datatype.boolean(),
        city: (): string => fakerInstance.location.city()
      };

      if (typeof keyName === `string` && keyName.toLowerCase() in keyToFnMap) {
        return keyToFnMap[keyName.toLowerCase()];
      }
    }
  };

  /** Set once per instance the first time the deprecated `mockeryMapper` is invoked. */
  #mockeryMapperWarned = false;

  constructor(options?: Partial<ValimockOptions>) {
    Object.assign(this.options, options);
  }

  #getChecks = ([_, ...pipe]: GenericPipe | GenericPipeAsync | []): Record<string, string | null> =>
    Object.fromEntries(
      (pipe as Array<v.GenericPipeItem | v.GenericPipeItemAsync>).reduce<Array<[key: string, expects: string | null]>>(
        (arr, item) => {
          if (v.isOfKind(`validation`, item)) {
            arr.push([item.type, item.expects]);
          }
          return arr;
        },
        []
      )
    );

  /**
   * Collect each validation action's `requirement` directly from the pipe. Avoids
   * the string-stripping (`.replace('>=','')`) that the older `#getChecks` form
   * required, and lets handlers see the raw value (number / bigint / Date / array).
   */
  #getRequirements = (
    pipe: ReadonlyArray<v.GenericPipeItem | v.GenericPipeItemAsync> | undefined
  ): Record<string, unknown> => {
    if (!pipe) return {};
    const out: Record<string, unknown> = {};
    for (const item of pipe) {
      if (v.isOfKind(`validation`, item) && `requirement` in item) {
        out[item.type] = (item as { requirement: unknown }).requirement;
      } else if (v.isOfKind(`validation`, item)) {
        out[item.type] = true; // requirement-less actions like `integer`, `finite`, `safe_integer`
      }
    }
    return out;
  };

  #getValidEnumValues = (obj: v.Enum): Array<number | string> =>
    Object.values(
      Object.entries(obj).reduce(
        (hash, [key, value]) => (typeof obj[value] === `number` ? hash : Object.assign(hash, { [key]: value })),
        {}
      )
    );

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
        return this.#schemas[schema.type](schema as never);
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

      this.options.onWarn(`Mock generation failed for schema type \`${schema.type}\`: ${String(err)}`);
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
    if (`empty` in checks) return [];
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
    const reqs = this.#getRequirements(schema.pipe);

    if (typeof reqs.value === `bigint`) return reqs.value;
    if (Array.isArray(reqs.values) && reqs.values.length > 0) {
      const allowed = reqs.values.filter((v): v is bigint => typeof v === `bigint`);
      if (allowed.length > 0) return this.options.faker.helpers.arrayElement(allowed);
    }

    const min =
      typeof reqs.min_value === `bigint`
        ? reqs.min_value
        : typeof reqs.gt_value === `bigint`
          ? reqs.gt_value + 1n
          : undefined;
    const max =
      typeof reqs.max_value === `bigint`
        ? reqs.max_value
        : typeof reqs.lt_value === `bigint`
          ? reqs.lt_value - 1n
          : undefined;

    return this.options.faker.number.bigInt({ min, max });
  };

  #mockBoolean = (
    schema: SchemaMaybeWithPipe<v.BooleanSchema<v.ErrorMessage<v.BooleanIssue> | undefined>>
  ): v.InferOutput<typeof schema> => this.options.faker.datatype.boolean();

  #mockDate = (
    schema: SchemaMaybeWithPipe<v.DateSchema<v.ErrorMessage<v.DateIssue> | undefined>>
  ): v.InferOutput<typeof schema> => {
    const reqs = this.#getRequirements(schema.pipe);

    if (reqs.value instanceof Date) return reqs.value;

    const min = reqs.min_value instanceof Date ? reqs.min_value : undefined;
    const max = reqs.max_value instanceof Date ? reqs.max_value : undefined;

    if (min && max) return this.options.faker.date.between({ from: min, to: max });
    if (min) return this.options.faker.date.soon({ refDate: min });
    if (max) return this.options.faker.date.recent({ refDate: max });
    return this.options.faker.date.soon();
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

  #mockRequired = <TSchema extends MaybeRequiredSchema<Schema | SyncSchema>>(
    schema: RequiredSchema<TSchema>
  ): v.InferOutput<typeof schema> => {
    const isNestedRequired = (val: Schema | SyncSchema): val is RequiredSchema<typeof val> =>
      Object.hasOwn(val, `expects`) &&
      ![`!null`, `(!null & !undefined)`, `!undefined`].includes(val.expects) &&
      Object.hasOwn(val, `wrapped`);
    if (isNestedRequired(schema.wrapped)) {
      return this.#mock(schema.wrapped.wrapped);
    }
    return this.#mock(schema.wrapped);
  };

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
  ): v.InferOutput<typeof schema> =>
    generateNumber(schema, {
      faker: this.options.faker,
      onWarn: this.options.onWarn
    });

  #mockObject = (
    schema:
      | v.ObjectSchema<v.ObjectEntries, v.ErrorMessage<v.ObjectIssue> | undefined>
      | v.ObjectSchemaAsync<v.ObjectEntriesAsync, v.ErrorMessage<v.ObjectIssue> | undefined>
  ): v.InferOutput<typeof schema> =>
    Object.entries(schema.entries).reduce<Record<string, v.GenericSchema>>((hash, [key, value]) => {
      const result = this.#mock<Schema>(value, key);
      // if a property is marked as exactOptional and it's mock value ended up
      // being undefined, just exclude the property key entirely to simulate
      // the expected behavior of that key being potentially missing
      if (v.isOfType(`exact_optional`, value) && typeof result === `undefined`) {
        return hash;
      }
      return {
        ...hash,
        [key]: result
      };
    }, {});

  #mockOptional = (
    schema: v.OptionalSchema<SyncSchema, SyncSchema> | v.OptionalSchemaAsync<Schema, Schema>
  ): v.InferOutput<typeof schema> =>
    schema.default ??
    this.options.faker.helpers.arrayElement([
      this.#mock<v.GenericSchema | v.GenericSchemaAsync>(schema.wrapped),
      undefined
    ]);

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
  ): v.InferOutput<typeof schema> =>
    generateString(schema, {
      faker: this.options.faker,
      keyName,
      stringMap: this.options.stringMap,
      mockeryMapper: this.options.mockeryMapper,
      onDeprecatedMapper: () => {
        if (this.#mockeryMapperWarned) return;
        this.#mockeryMapperWarned = true;
        this.options.onWarn(
          `\`mockeryMapper\` is deprecated and will be removed in a future major. ` +
            `Prefer \`stringMap\` for per-key overrides, or contribute an action handler upstream.`
        );
      },
      onWarn: this.options.onWarn
    });

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
  ): v.InferOutput<typeof schema> => this.#mock(this.options.faker.helpers.arrayElement(schema.options));

  #mockUndefined = (
    schema: v.UndefinedSchema<v.ErrorMessage<v.UndefinedIssue> | undefined>
  ): v.InferOutput<typeof schema> => undefined;

  #mockVariant = <Key extends string = string>(
    schema: v.VariantSchema<Key, v.VariantOptions<Key>, v.ErrorMessage<v.VariantIssue> | undefined>
  ): v.InferOutput<typeof schema> => this.#mock(this.options.faker.helpers.arrayElement(schema.options)) ?? {};

  #schemas: Record<string, (schema: never) => unknown> = {
    array: this.#mockArray,
    bigint: this.#mockBigint,
    boolean: this.#mockBoolean,
    date: this.#mockDate,
    enum: this.#mockEnum,
    exactOptional: this.#mockOptional,
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
    required: this.#mockRequired,
    recursive: this.#mockRecursive,
    set: this.#mockSet,
    string: this.#mockString,
    tuple: this.#mockTuple,
    union: this.#mockUnion,
    undefined: this.#mockUndefined,
    variant: this.#mockVariant
  };
}
