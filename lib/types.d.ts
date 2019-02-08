import { Record, Collection } from "./internals"
export declare type Partial<T> = { [P in keyof T]?: T[P] }
export declare type OptimisticPrimaryKey = string
export declare type PrimaryKey = string | number
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
export declare type HookList = Array<(Record: any) => Promise<any>>
export interface RecordHooks {
  beforeDestroy: HookList
  afterCreate: HookList
  beforeSave: HookList
  afterSave: HookList
  onAttributesMutation: HookList
}
export interface RecordDataSynchronizer {
  name: string
  pull: (Record: any) => Promise<any>
  push: (Record: any) => Promise<any>
}
export interface RecordDataSynchronizerStrategy {
  onSave: (Record: any) => {}
  onLoad: (Record: any) => {}
  onDelete: () => {}
}
