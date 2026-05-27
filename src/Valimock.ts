/* eslint-disable @typescript-eslint/class-methods-use-this */

/* eslint-disable @typescript-eslint/unbound-method */
import { faker as defaultFaker, type Faker } from "@faker-js/faker";
import * as v from "valibot";
import { generateArray } from "./schemas/array.js";
import { generateBigint } from "./schemas/bigint.js";
import { generateBlob } from "./schemas/blob.js";
import { generateDate } from "./schemas/date.js";
import { generateFile } from "./schemas/file.js";
import { generateIntersect } from "./schemas/intersect.js";
import { generateMap } from "./schemas/map.js";
import { generateNumber } from "./schemas/number/generateNumber.js";
import { generateObject } from "./schemas/object.js";
import { generateRecord } from "./schemas/record.js";
import { generateSet } from "./schemas/set.js";
import { generateString } from "./schemas/string/generateString.js";
import { generateTuple } from "./schemas/tuple.js";
import { generateUnion } from "./schemas/union.js";
import { generateVariant } from "./schemas/variant.js";
import type { Schema, SchemaMaybeWithPipe, SyncSchema, MaybeRequiredSchema, RequiredSchema } from "./types.js";

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
      // Schemas like `v.custom(...)` validate via an arbitrary user predicate
      // we can't introspect, so we have no general way to produce a satisfying
      // value. Surface that explicitly (Rule 12 — fail loud) so callers can
      // route the case via `customMocks` instead of silently receiving undefined.
      this.options.onWarn(
        `No built-in mocker for schema type \`${schema.type}\`. ` +
          `Provide a \`customMocks.${schema.type}\` entry, set \`throwOnUnknownType: true\` to surface this as an error, ` +
          `or restructure the schema. Returning \`undefined\`.`
      );
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
  ): v.InferOutput<TSchema> =>
    generateArray(schema, {
      faker: this.options.faker,
      onWarn: this.options.onWarn,
      mockItem: (item) => this.#mock(item)
    }) as v.InferOutput<TSchema>;

  #mockBigint = (
    schema: SchemaMaybeWithPipe<v.BigintSchema<v.ErrorMessage<v.BigintIssue> | undefined>>
  ): v.InferOutput<typeof schema> =>
    generateBigint(schema, {
      faker: this.options.faker,
      onWarn: this.options.onWarn
    });

  #mockBoolean = (
    schema: SchemaMaybeWithPipe<v.BooleanSchema<v.ErrorMessage<v.BooleanIssue> | undefined>>
  ): v.InferOutput<typeof schema> => this.options.faker.datatype.boolean();

  #mockDate = (
    schema: SchemaMaybeWithPipe<v.DateSchema<v.ErrorMessage<v.DateIssue> | undefined>>
  ): v.InferOutput<typeof schema> =>
    generateDate(schema, {
      faker: this.options.faker,
      onWarn: this.options.onWarn
    });

  #mockPicklist = (
    schema: v.PicklistSchema<v.PicklistOptions, v.ErrorMessage<v.PicklistIssue> | undefined>
  ): v.InferOutput<typeof schema> => this.options.faker.helpers.arrayElement(schema.options);

  #mockIntersect = (
    schema: v.IntersectSchema<v.IntersectOptions, v.ErrorMessage<v.IntersectIssue> | undefined>
  ): v.InferOutput<typeof schema> =>
    generateIntersect(schema, {
      mockItem: (item) => this.#mock(item),
      onWarn: this.options.onWarn
    }) as v.InferOutput<typeof schema>;

  #mockLiteral = (
    schema: v.LiteralSchema<v.Literal, v.ErrorMessage<v.LiteralIssue> | undefined>
  ): v.InferOutput<typeof schema> => schema.literal;

  #mockMap = (
    schema:
      | v.MapSchema<SyncSchema, SyncSchema, v.ErrorMessage<v.MapIssue> | undefined>
      | v.MapSchemaAsync<Schema, Schema, v.ErrorMessage<v.MapIssue> | undefined>
  ): v.InferOutput<typeof schema> =>
    generateMap(schema, {
      entriesLength: this.options.mapEntriesLength,
      mockItem: (item) => this.#mock(item),
      onWarn: this.options.onWarn
    }) as v.InferOutput<typeof schema>;

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
  ): v.InferOutput<typeof schema> => {
    if (schema.default !== undefined) {
      return v.getDefault(schema as never) as v.InferOutput<typeof schema>;
    }
    return (
      this.options.faker.helpers.arrayElement([this.#mock(schema.wrapped), null, undefined]) ??
      this.options.faker.helpers.arrayElement([null, undefined])
    );
  };

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
    generateObject(schema, {
      mockItem: (s, key) => this.#mock(s as Schema, key)
    }) as v.InferOutput<typeof schema>;

  #mockOptional = (
    schema: v.OptionalSchema<SyncSchema, SyncSchema> | v.OptionalSchemaAsync<Schema, Schema>
  ): v.InferOutput<typeof schema> => {
    // When the schema declares a default, honor it — `parse` will fill that
    // value in when the key is absent, so emitting it here keeps parse(mock)
    // structurally equal to mock(). `schema.default` may be a value or a
    // function (per Valibot's `getDefault` helper).
    if (schema.default !== undefined) {
      return v.getDefault(schema as never) as v.InferOutput<typeof schema>;
    }
    return this.options.faker.helpers.arrayElement([
      this.#mock<v.GenericSchema | v.GenericSchemaAsync>(schema.wrapped),
      undefined
    ]);
  };

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
    generateRecord(schema, {
      entriesLength: this.options.recordKeysLength,
      mockItem: (item) => this.#mock(item)
    }) as v.InferOutput<typeof schema>;

  /**
   * `lazy` schema: getter returns the actual schema. We pass `undefined` since
   * we have no input value during mocking. Only the sync `LazySchema` variant
   * is fully supported here — `LazySchemaAsync.getter` may return a Promise,
   * in which case we can't mock synchronously and emit a warning.
   */
  #mockLazy = (
    schema: v.LazySchema<v.GenericSchema> | v.LazySchemaAsync<v.GenericSchema | v.GenericSchemaAsync>
  ): v.InferOutput<typeof schema> => {
    const inner = schema.getter(undefined);
    if (inner instanceof Promise) {
      this.options.onWarn(
        `lazy: async getter returned a Promise; synchronous mock() cannot resolve it. Use parseAsync at call sites that need this schema.`
      );
      return undefined as v.InferOutput<typeof schema>;
    }
    return this.#mock(inner as Schema);
  };

  #mockSet = <
    TSchema extends
      | v.SetSchema<SyncSchema, v.ErrorMessage<v.SetIssue> | undefined>
      | v.SetSchemaAsync<Schema, v.ErrorMessage<v.SetIssue> | undefined> =
      | v.SetSchema<SyncSchema, v.ErrorMessage<v.SetIssue> | undefined>
      | v.SetSchemaAsync<Schema, v.ErrorMessage<v.SetIssue> | undefined>
  >(
    schema: SchemaMaybeWithPipe<TSchema>
  ): v.InferOutput<TSchema> =>
    generateSet(schema, {
      faker: this.options.faker,
      onWarn: this.options.onWarn,
      mockItem: (item) => this.#mock(item)
    }) as v.InferOutput<TSchema>;

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
  ): v.InferOutput<typeof schema> =>
    generateTuple(schema, {
      mockItem: (item) => this.#mock(item)
    }) as v.InferOutput<typeof schema>;

  #mockUnion = (
    schema:
      | v.UnionSchema<v.UnionOptions, v.ErrorMessage<v.UnionIssue<v.BaseIssue<unknown>>> | undefined>
      | v.UnionSchemaAsync<
          v.UnionOptions | v.UnionOptionsAsync,
          v.ErrorMessage<v.UnionIssue<v.BaseIssue<unknown>>> | undefined
        >
  ): v.InferOutput<typeof schema> =>
    generateUnion(schema, {
      mockItem: (item) => this.#mock(item),
      pickOption: (opts) => this.options.faker.helpers.arrayElement(opts),
      onWarn: this.options.onWarn
    }) as v.InferOutput<typeof schema>;

  #mockUndefined = (
    schema: v.UndefinedSchema<v.ErrorMessage<v.UndefinedIssue> | undefined>
  ): v.InferOutput<typeof schema> => undefined;

  #mockVariant = <Key extends string = string>(
    schema: v.VariantSchema<Key, v.VariantOptions<Key>, v.ErrorMessage<v.VariantIssue> | undefined>
  ): v.InferOutput<typeof schema> =>
    generateVariant(schema, {
      mockItem: (item) => this.#mock(item),
      pickOption: (opts) => this.options.faker.helpers.arrayElement(opts)
    }) as v.InferOutput<typeof schema>;

  // ── Type-only schemas (no constraint surface beyond "is this type") ────

  #mockAny = (_schema: v.AnySchema): unknown =>
    this.options.faker.helpers.arrayElement([
      this.options.faker.lorem.word(),
      this.options.faker.number.int(),
      true,
      null
    ]);

  #mockUnknown = (_schema: v.UnknownSchema): unknown => this.#mockAny(_schema as unknown as v.AnySchema);

  #mockVoid = (_schema: v.VoidSchema<v.ErrorMessage<v.VoidIssue> | undefined>): undefined => undefined;

  /**
   * `never` is unsatisfiable by design — no value passes parse. Throw a
   * MockError so callers can detect schemas that are definitionally
   * un-mockable rather than silently emitting `undefined`.
   */
  #mockNever = (_schema: v.NeverSchema<v.ErrorMessage<v.NeverIssue> | undefined>): never => {
    throw new MockError(`never`);
  };

  #mockFunction =
    (_schema: v.FunctionSchema<v.ErrorMessage<v.FunctionIssue> | undefined>): ((...args: unknown[]) => unknown) =>
    (..._args: unknown[]): unknown =>
      undefined;

  #mockSymbol = (_schema: v.SymbolSchema<v.ErrorMessage<v.SymbolIssue> | undefined>): symbol => Symbol();

  #mockPromise = (_schema: v.PromiseSchema<v.ErrorMessage<v.PromiseIssue> | undefined>): Promise<unknown> =>
    Promise.resolve(undefined);

  #mockUndefinedable = (
    schema: v.UndefinedableSchema<SyncSchema, SyncSchema> | v.UndefinedableSchemaAsync<Schema, Schema>
  ): v.InferOutput<typeof schema> => {
    if (schema.default !== undefined) {
      return v.getDefault(schema as never) as v.InferOutput<typeof schema>;
    }
    return this.options.faker.helpers.arrayElement([this.#mock(schema.wrapped), undefined]);
  };

  /**
   * `instance` validates `input instanceof schema.class`. We can only produce a
   * fitting mock when the class has a zero-arg constructor; otherwise we warn
   * and return a best-effort `Object.create(prototype)` instance.
   */
  #mockInstance = (schema: v.InstanceSchema<v.Class, v.ErrorMessage<v.InstanceIssue> | undefined>): unknown => {
    try {
      return new (schema.class as new () => unknown)();
    } catch (err) {
      this.options.onWarn(
        `instance(${schema.class.name}): class requires constructor arguments; returning a prototype-based placeholder. (${String(err)})`
      );
      return Object.create((schema.class as { prototype: object }).prototype);
    }
  };

  /**
   * `blob` schema with pipeline support. Honors size / min_size / max_size /
   * not_size / mime_type. Returns a placeholder when the `Blob` global is
   * unavailable (Node < 18 without polyfills).
   */
  #mockBlob = (schema: SchemaMaybeWithPipe<v.BlobSchema<v.ErrorMessage<v.BlobIssue> | undefined>>): unknown =>
    generateBlob(schema, { onWarn: this.options.onWarn });

  /**
   * `file` schema with pipeline support. Same action set as `blob` since File
   * extends Blob. Returns a placeholder when the `File` global is unavailable.
   */
  #mockFile = (schema: SchemaMaybeWithPipe<v.FileSchema<v.ErrorMessage<v.FileIssue> | undefined>>): unknown =>
    generateFile(schema, { onWarn: this.options.onWarn });

  #schemas: Record<string, (schema: never) => unknown> = {
    any: this.#mockAny,
    array: this.#mockArray,
    bigint: this.#mockBigint,
    blob: this.#mockBlob,
    boolean: this.#mockBoolean,
    date: this.#mockDate,
    enum: this.#mockEnum,
    exact_optional: this.#mockOptional,
    file: this.#mockFile,
    function: this.#mockFunction,
    instance: this.#mockInstance,
    intersect: this.#mockIntersect,
    lazy: this.#mockLazy,
    literal: this.#mockLiteral,
    loose_object: this.#mockObject,
    loose_tuple: this.#mockTuple,
    map: this.#mockMap,
    nan: this.#mockNaN,
    never: this.#mockNever,
    non_nullable: this.#mockRequired,
    non_nullish: this.#mockRequired,
    non_optional: this.#mockRequired,
    null: this.#mockNull,
    nullable: this.#mockNullable,
    nullish: this.#mockNullish,
    number: this.#mockNumber,
    object: this.#mockObject,
    object_with_rest: this.#mockObject,
    optional: this.#mockOptional,
    picklist: this.#mockPicklist,
    promise: this.#mockPromise,
    record: this.#mockRecord,
    set: this.#mockSet,
    strict_object: this.#mockObject,
    strict_tuple: this.#mockTuple,
    string: this.#mockString,
    symbol: this.#mockSymbol,
    tuple: this.#mockTuple,
    tuple_with_rest: this.#mockTuple,
    undefined: this.#mockUndefined,
    undefinedable: this.#mockUndefinedable,
    union: this.#mockUnion,
    unknown: this.#mockUnknown,
    variant: this.#mockVariant,
    void: this.#mockVoid
  };
}
