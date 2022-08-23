
export type BasicValue = string|number|boolean

export interface CollectionMeta {
  id: string
  schema: CollectionMetaSchema
}

export interface CollectionMetaSchema {
  type: 'object',
  properties: Record<string, CollectionMetaSchemaField>
}

export interface CollectionMetaSchemaField {
  type: 'string'|'number'|'boolean'
}
