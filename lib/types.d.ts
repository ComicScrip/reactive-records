import { Record, Collection } from "./internals"
import { Scope } from "./Scope"
export declare type Partial<T> = { [P in keyof T]?: T[P] }
export declare type OptimisticPrimaryKey = string
export declare type PrimaryKey = string | number
export interface RecordConstructor {
  new (): Record
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
export declare type PersistenceServiceName = string
export interface PersistenceStrategy {
  persistenceServices: Map<PersistenceServiceName, object>
  loadMany(params: object, scope: Scope<Record>): Promise<any>
  loadOne(params: object, record: Record, scope: Scope<Record>): Promise<any>
  saveOne(params: object, record: Record, scope: Scope<Record>): Promise<any>
  destroyOne(params: object, record: Record, scope: Scope<Record>): Promise<any>
}
