
export type BasicValue = string|number|boolean

export interface CollectionMeta {
  id: string
  schema: CollectionMetaSchema
  indexes?: CollectionMetaIndex[]
}

export interface CollectionMetaSchema {
  type: 'object',
  properties: Record<string, CollectionMetaSchemaField>
}

export interface CollectionMetaIndex {
  fields: CollectionMetaIndexField[]
}

export interface CollectionMetaIndexField {
  field: string
  direction: 'asc'|'desc'
}

export interface CollectionMetaSchemaField {
  type: 'string'|'number'|'boolean'
}
