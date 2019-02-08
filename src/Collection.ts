import { action, computed, observable } from "mobx"
import * as Bluebird from "bluebird"
Promise = Bluebird as any
import { Record, Partial, PrimaryKey } from "./internals"

/**
 * A Store for records.
 * All Storage related manipulations are done here (local and remote synchronisations, instances in memory, ...)
 */
export abstract class Collection<T extends Record> {
  /**
   * Holds the _collection's records' instances
   * The map is indexed by the records' primary key values.
   */
  @observable.shallow
  private records = new Map<PrimaryKey, T>()

  /**
   * Get the _collection's records' constructor
   */
  public abstract get recordClass(): typeof Record

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
  public get items(): Array<T> {
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
  public get(primaryKey: PrimaryKey): T {
    return this.records.get(primaryKey)
  }

  public wherePropEq(propName: keyof T, propValue: any): T[] {
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
  public getMany(primaryKeyList: PrimaryKey[]): T[] {
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
  public set(recordProperties: Partial<T>, strict = true): T {
    if (recordProperties instanceof Record) {
      return recordProperties as T
    }
    const recordClass = this.recordClass
    const recordInstance = new recordClass(this) as T
    recordInstance._mergeProperties(recordProperties, strict)
    this.records.set(recordInstance._primaryKeyValue, recordInstance)

    return recordInstance
  }

  /**
   * Add or replace one record in the collection
   * @param recordInstance The record instance to set in the collection
   */
  @action.bound
  public setRecord(recordInstance: T): T {
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
  public setMany(recordPropertiesList: Partial<T>[], strict = true): T[] {
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
}
