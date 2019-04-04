import { action, computed, observable, ObservableMap } from "mobx"
import { createTransformer } from "mobx-utils"
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
  @observable
  private records: ObservableMap<PrimaryKey, RecordType> = observable.map()

  /**
   * The collection's scopes
   */
  @observable
  private scopes: ObservableMap<string, Scope<RecordType>> = observable.map()

  public persistenceStrategy: PersistenceStrategy = null

  /**
   * Get the collection's records' constructor
   */
  public abstract get recordClass(): typeof Record

  /**
   * Returns the persistence strategy for this collection, or throw an error is not defined
   * @return {PersistenceStrategy}
   */
  public getPersistenceStrategy(): PersistenceStrategy {
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
   * Returns all the collection scopes names in an array
   * @return {string[]}
   */
  public get scopesNames(): string[] {
    return (this.scopes as any)._keys
  }

  /**
   * Get a collection scopes whose name matches a given regex
   * @return {Scope<RecordType extends Record>}
   * @param regex The regex that will be used against all scopes name
   */
  public getScopesMatching(regex: RegExp): Array<Scope<RecordType>> {
    return this.scopesNames
      .filter(scopeName => scopeName.match(regex))
      .map(name => this.scopes.get(name))
  }

  /**
   * Filters all the collection scopes with a regex and return their items concatenated
   */
  public getCombinedScopeItems = ((regex: RegExp) => {
    const scopeNames = this.scopesNames
    let items = []
    for (let i = 0; i < scopeNames.length; i++) {
      const scope = scopeNames[i]
      if (scope.match(regex)) {
        items = items.concat(this.scopes.get(scope).items)
      }
    }
    return items
  }).bind(this)

  /**
   * Takes all scopes matching a regex and concat their items
   * @return {RecordType[]}
   * @param regex The regex that will be used against all scopes name
   */
  public combineScopeItems = createTransformer(this.getCombinedScopeItems) as (
    regex: RegExp
  ) => RecordType[]

  /**
   * Get an existing scope or create a new one
   * @param {string} name : The name of the scope
   * @param {object} params : the scope's params to be set if specified
   * @return {Scope<RecordType extends Record>}
   */
  public provideScope(name: string = "default", params?: object): Scope<RecordType> {
    let scope = this.getScope(name)

    if (scope) {
      return scope
    } else {
      scope = new Scope(this, name, params)
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

  /**
   * remove a scope from the collection
   * @param {Scope<RecordType extends Record>} scope
   */
  @action.bound
  public unsetScope(scope: Scope<RecordType>) {
    this.scopes.delete(scope.name)
  }

  /**
   * Set the collection's persistence strategy
   * @param ps {PersistenceStrategy} : The persistence strategy to set
   * @return {Collection<Record>} : The collection
   */
  @action.bound
  public setPersistenceStratgy(ps: PersistenceStrategy) {
    this.persistenceStrategy = ps
    return this
  }

  /**
   * Get an array of the collection's record's primary keys
   * @return {PrimaryKey[]}
   */
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

  /**
   * Return the collection items filtered by a value on a property
   * @param {keyof RecordType} propName
   * @param propValue
   * @return {RecordType[]}
   */
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
   */
  @action.bound
  public set(recordProperties: Partial<RecordType>): RecordType {
    // TODO: add an option to replace or not
    if (recordProperties instanceof Record) {
      return recordProperties as RecordType
    }
    const recordClass = this.recordClass
    const recordInstance = new recordClass(this) as RecordType
    recordInstance._mergeProperties(recordProperties)
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
    if (oldPk === newPk) return
    const record = this.get(oldPk)
    if (record) {
      this.records.set(newPk, this.get(oldPk))
      this.records.delete(oldPk)
    }
  }

  /**
   * Add or replace multiple records in the _collection
   * @param recordPropertiesList An array of plain object reprsentation of the records' properties
   */
  @action.bound
  public setMany(recordPropertiesList: Partial<RecordType>[]): RecordType[] {
    const recordInstances = []
    for (let i = 0; i < recordPropertiesList.length; i++) {
      const recordProperties = recordPropertiesList[i]
      recordInstances.push(this.set(recordProperties))
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
  public async load(params: any = {}, scopeName: string = "default"): Promise<any> {
    return this.getPersistenceStrategy().loadMany(params, this.provideScope(scopeName, params))
  }

  /**
   * Loads a record into the collection using the collection's persitence strategy
   */
  @action.bound
  public async loadOne(
    record: Record | PrimaryKey,
    params: any = {},
    scopeName: string = "default"
  ): Promise<any> {
    if (!(record instanceof Record)) {
      const r = { [this.recordClass.primaryKeyName]: record } as any
      record = this.set(r)
    }
    return this.getPersistenceStrategy().loadOne(
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
    params: any = {},
    scopeName: string = "default"
  ): Promise<any> {
    return this.getPersistenceStrategy().saveOne(
      params,
      record,
      this.provideScope(scopeName, params)
    )
  }

  /**
   * Destroys one record of the collection using the collection's persitence strategy
   */
  @action.bound
  public async destroyOne(
    record: Record,
    params: any = {},
    scopeName: string = "default"
  ): Promise<any> {
    return this.getPersistenceStrategy().destroyOne(
      params,
      record,
      this.provideScope(scopeName, params)
    )
  }

  /**
   * Unset all scopes and records from the collection
   */
  @action.bound
  reset() {
    this.scopes = observable.map()
    this.clear()
  }
}
