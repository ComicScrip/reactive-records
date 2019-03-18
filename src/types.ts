import { Record, Collection } from "./internals"
import { Scope } from "./Scope"

export type Partial<T> = { [P in keyof T]?: T[P] }
export type OptimisticPrimaryKey = string
export type PrimaryKey = string | number

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

export type PersistenceServiceName = string

export interface PersistenceStrategy {
  persistenceServices: object
  loadMany(params: any, scope: Scope<Record>): Promise<any>
  loadOne(params: any, record: Record, scope: Scope<Record>): Promise<any>
  saveOne(params: any, record: Record, scope: Scope<Record>): Promise<any>
  destroyOne(params: any, record: Record, scope: Scope<Record>): Promise<any>
}
