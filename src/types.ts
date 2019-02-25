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

export interface toJSOptions {
  expandAssociations: boolean | string
  expandAssociationsLevels: number
}

export type PersistenceServiceName = string

export interface PersistenceService {
  name: PersistenceServiceName
  loadMany(params: object, scope: Scope<Record>): Promise<any>
  loadOne(params: object, record: Record, scope: Scope<Record>): Promise<any>
  saveOne(params: object, record: Record, scope: Scope<Record>): Promise<any>
  destroyOne(params: object, record: Record, scope: Scope<Record>): Promise<any>
}

export interface PersistenceStrategy {
  persistenceServices: Map<PersistenceServiceName, PersistenceService>
  loadMany(params: object, scope: Scope<Record>): Promise<any>
  loadOne(params: object, record: Record, scope: Scope<Record>): Promise<any>
  saveOne(params: object, record: Record, scope: Scope<Record>): Promise<any>
  destroyOne(params: object, record: Record, scope: Scope<Record>): Promise<any>
}
