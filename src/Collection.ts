import { action, computed, observable } from "mobx"
import * as Bluebird from "bluebird"
Promise = Bluebird as any
import { Record, Partial, PrimaryKey, PersistenceStrategy } from "./internals"
import { Scope } from "./Scope"

/**
 * A Store for records.
 * All Storage related manipulations are done here (local and remote synchronisations, instances in memory, ...)
 */
export abstract class Collection<RecordType extends Record> {
  /**
   * Holds all the collection's records' instances
   * The map is indexed by the records' primary key values.
   */
  @observable.shallow
  private records = new Map<PrimaryKey, RecordType>()

  /**
   * Get the collection's records' constructor
   */
  public abstract get recordClass(): typeof Record

  /**
   * The collection's scopes
   * @type {Map}
   */
  @observable
  private scopes = new Map<string, Scope<RecordType>>()

  public persistenceStrategy: PersistenceStrategy = null

  public getPersistanceStrategy(): PersistenceStrategy {
    if (this.persistenceStrategy === null) {
      throw new Error(
        `Please define a persistence strategy for the collection '${
          (this.constructor as any).name
        }'`
      )
    }
    return this.persistenceStrategy
  }

  /**
   * Get a collection scope by name
   * @param {string} name : the name of the scope
   * @return {Scope<RecordType extends Record>}
   */
  public getScope(name: string): Scope<RecordType> | undefined {
    return this.scopes.get(name)
  }

  /**
   * Get an existing scope or create a new one
   * @param {string} name : The name of the scope
   * @param {object} params : the scope's params to be set if specified
   * @return {Scope<RecordType extends Record>}
   */
  public provideScope(
    name: string = "default",
    params?: object
  ): Scope<RecordType> {
    let scope = this.getScope(name)

    if (scope) {
      return scope
    } else {
      scope = new Scope(this, name)
      this.setScope(scope)
    }

    if (params) {
      scope.setParams(params)
    }

    return scope
  }

  /**
   * Set a scope into the collection's scope set
   * @param {Scope<RecordType extends Record>} scope
   */
  @action.bound
  public setScope(scope: Scope<RecordType>) {
    this.scopes.set(scope.name, scope)
  }

  @computed
  get itemsPrimaryKeys(): PrimaryKey[] {
    // ObservebaleMap.prototype._keys is much faster than keys() and returns directly what we need
    return (this.records as any)._keys
  }

  /**
   * Get a list of the _collection's record instances
   * @returns An array of Record instances
   */
  @computed
  public get items(): Array<RecordType> {
    const items = []
    for (let i = 0; i < this.itemsPrimaryKeys.length; i++) {
      const itemPrimaryKey = this.itemsPrimaryKeys[i]
      items[i] = this.records.get(itemPrimaryKey)
    }
    return items
  }

  /**
   * Indicates whether or not the _collection contains a record with a given primary key
   * @param primaryKey The primary key whose existence will be checked
   * @returns true if the primary key is present, false otherwise
   */
  public has(primaryKey): boolean {
    return this.records.has(primaryKey)
  }

  /**
   * Get a record instance in the _collection form its primary key
   * @param primaryKey the reocrd's primary key value
   * @return The record instance or undefined if there is no record with the given primary key
   */
  public get(primaryKey: PrimaryKey): RecordType {
    return this.records.get(primaryKey)
  }

  public wherePropEq(propName: keyof RecordType, propValue: any): RecordType[] {
    const filteredRecords = []
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i]
      if (item[propName] == propValue) {
        filteredRecords.push(item)
      }
    }
    return filteredRecords
  }

  /**
   * Get multiple record instances in the _collection form their primary keys
   * @param primaryKeyList the reocrds' primary key values
   */
  public getMany(primaryKeyList: PrimaryKey[]): RecordType[] {
    const recordInstances = []
    for (let i = 0; i < primaryKeyList.length; i++) {
      const primaryKey = primaryKeyList[i]
      recordInstances.push(this.get(primaryKey))
    }
    return recordInstances
  }

  /**
   * Get the size of the collection
   * @returns The number of (all) items in the collection
   */
  @computed
  public get size(): number {
    return this.records.size
  }

  /**
   * Add or replace one record in the collection
   * @param recordProperties A plain object reprsentation of the record's properties
   * @param strict Indicates whether or not the method should throw an exception
   * if one of the provided recordProperties keys is not defined
   * as being a property of the Record subclass associated with the colection
   */
  @action.bound
  public set(recordProperties: Partial<RecordType>, strict = true): RecordType {
    if (recordProperties instanceof Record) {
      return recordProperties as RecordType
    }
    const recordClass = this.recordClass
    const recordInstance = new recordClass(this) as RecordType
    recordInstance._mergeProperties(recordProperties, strict)
    this.records.set(recordInstance._primaryKeyValue, recordInstance)

    return recordInstance
  }

  /**
   * Add or replace one record in the collection
   * @param recordInstance The record instance to set in the collection
   */
  @action.bound
  public setRecord(recordInstance: RecordType): RecordType {
    this.records.set(recordInstance._primaryKeyValue, recordInstance)
    return recordInstance
  }

  /**
   * Updates the index of the a record with a primaryKeyValue of oldPk (if found)
   * in the collection's records' map
   * @param oldPk the index to be replaced
   * @param newPk the new value of the index
   */
  @action.bound
  public updateRecordPrimaryKey(oldPk: PrimaryKey, newPk: PrimaryKey) {
    const record = this.get(oldPk)
    if (record) {
      this.records.set(newPk, this.get(oldPk))
      this.records.delete(oldPk)
    }
  }

  /**
   * Add or replace multiple records in the _collection
   * @param recordPropertiesList An array of plain object reprsentation of the records' properties
   * @param strict Indicates whether or not the method should throw an exception
   * if one of the provided recordProperties keys is not defined
   * as being a property of the Record subclass associated with the colection
   */
  @action.bound
  public setMany(
    recordPropertiesList: Partial<RecordType>[],
    strict = true
  ): RecordType[] {
    const recordInstances = []
    for (let i = 0; i < recordPropertiesList.length; i++) {
      const recordProperties = recordPropertiesList[i]
      recordInstances.push(this.set(recordProperties, strict))
    }
    return recordInstances
  }

  /**
   * Delete a record with a given primary key in the _collection
   * @param primaryKey The identifier of the record to delete from the _collection
   */
  @action.bound
  public unset(primaryKey: PrimaryKey) {
    this.records.delete(primaryKey)
    return this
  }

  /**
   * Delete multipe records in the _collection form their primary keys
   * @param primaryKeyList The identifiers of the records to delete from the _collection
   */
  @action.bound
  public unsetMany(primaryKeyList: PrimaryKey[]) {
    for (let i = 0; i < primaryKeyList.length; i++) {
      const primaryKey = primaryKeyList[i]
      this.unset(primaryKey)
    }
    return this
  }

  /**
   * Delete all the records in the _collection
   */
  @action.bound
  public clear(): this {
    this.records.clear()
    return this
  }

  /**
   * Loads items into the collection using the collection's persitence strategy
   */
  @action.bound
  public async load(
    scopeName: string = "default",
    params: object = {}
  ): Promise<any> {
    return this.getPersistanceStrategy().loadMany(
      params,
      this.provideScope(scopeName, params)
    )
  }

  /**
   * Loads a record into the collection using the collection's persitence strategy
   */
  @action.bound
  public async loadOne(
    record: Record | PrimaryKey,
    scopeName: string = "default",
    params: object = {}
  ): Promise<any> {
    if (!(record instanceof Record)) {
      const r = { [this.recordClass.primaryKeyName]: record } as any
      record = this.set(r)
    }
    return this.getPersistanceStrategy().loadOne(
      params,
      record as Record,
      this.provideScope(scopeName, params)
    )
  }

  /**
   * Saves one record into the collection using the collection's persitence strategy
   */
  @action.bound
  public async saveOne(
    record: Record,
    scopeName: string = "default",
    params: object = {}
  ): Promise<any> {
    return this.getPersistanceStrategy().saveOne(
      params,
      record,
      this.provideScope(scopeName, params)
    )
  }

  /**
   * Destroys one record into the collection using the collection's persitence strategy
   */
  @action.bound
  public async destroyOne(
    record: Record,
    scopeName: string = "default",
    params: object = {}
  ): Promise<any> {
    return this.getPersistanceStrategy().destroyOne(
      params,
      record,
      this.provideScope(scopeName, params)
    )
  }
}
