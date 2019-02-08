import { Record, Collection } from "./internals"

export type Partial<T> = { [P in keyof T]?: T[P] }
export type OptimisticPrimaryKey = string
export type PrimaryKey = string | number

export interface RecordConstructor {
  new (): Record
}

export interface RecordConfig {
  progressDebounceMs: number
}

export interface toOneAssociationDescription<T> {
  foreignCollection: () => Collection<Record>
  foreignKeyAttribute?: keyof T
}

export interface toOneAssociationsDescription<T> {
  [name: string]: toOneAssociationDescription<T>
}

export interface toManyAssociationDescription<T> {
  foreignCollection: () => Collection<Record>
  foreignKeyAttribute?: keyof T
}

export interface toManyAssociationsDescription<T> {
  [name: string]: toManyAssociationDescription<T>
}

export interface toJSOptions {
  expandAssociations: boolean | string
  expandAssociationsLevels: number
}

export type HookList = Array<(Record) => Promise<any>>

export interface RecordHooks {
  beforeDestroy: HookList
  afterCreate: HookList
  beforeSave: HookList
  afterSave: HookList
  onAttributesMutation: HookList
}

export interface RecordDataSynchronizer {
  name: string
  pull: (Record) => Promise<any>
  push: (Record) => Promise<any>
}

export interface RecordDataSynchronizerStrategy {
  onSave: (Record) => {}
  onLoad: (Record) => {}
  onDelete: () => {}
}
