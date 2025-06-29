import type * as v from "valibot";

type Optional<T, K extends keyof T> = Omit<T, K> & Pick<Partial<T>, K>;
export type GenericPipe = [v.GenericSchema, ...v.GenericPipeItem[]];
type GenericSchemaWithPipe = v.SchemaWithPipe<GenericPipe>;
export type GenericPipeAsync = [
  v.GenericSchema | v.GenericSchemaAsync,
  ...Array<v.GenericPipeItem | v.GenericPipeItemAsync>
];
type GenericSchemaWithPipeAsync = v.SchemaWithPipeAsync<GenericPipeAsync>;
export type SyncSchema = GenericSchemaWithPipe | v.GenericSchema;
export type Schema = GenericSchemaWithPipe | GenericSchemaWithPipeAsync | v.GenericSchema | v.GenericSchemaAsync;
export type SchemaMaybeWithPipe<TSchema extends v.GenericSchema | v.GenericSchemaAsync> = Optional<
  TSchema extends v.GenericSchema
    ? v.SchemaWithPipe<[TSchema, ...v.GenericPipeItem[]]>
    : v.SchemaWithPipeAsync<[TSchema, ...Array<v.GenericPipeItem | v.GenericPipeItemAsync>]>,
  `pipe`
>;
export type RequiredSchema<TSchema extends Schema | SyncSchema> = TSchema extends SyncSchema
  ?
      | v.NonNullableSchema<SyncSchema, v.ErrorMessage<v.NonNullableIssue> | undefined>
      | v.NonNullishSchema<SyncSchema, v.ErrorMessage<v.NonNullishIssue> | undefined>
      | v.NonOptionalSchema<SyncSchema, v.ErrorMessage<v.NonOptionalIssue> | undefined>
  :
      | v.NonNullableSchemaAsync<Schema, v.ErrorMessage<v.NonNullableIssue> | undefined>
      | v.NonNullishSchemaAsync<Schema, v.ErrorMessage<v.NonNullishIssue> | undefined>
      | v.NonOptionalSchemaAsync<Schema, v.ErrorMessage<v.NonOptionalIssue> | undefined>;
export type MaybeRequiredSchema<TSchema extends Schema | SyncSchema> = TSchema | RequiredSchema<TSchema>;
