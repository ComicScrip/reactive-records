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
  private records
  /**
   * Get the _collection's records' constructor
   */
  abstract readonly recordClass: typeof Record
  readonly itemsPrimaryKeys: PrimaryKey[]
  /**
   * Get a list of the _collection's record instances
   * @returns An array of Record instances
   */
  readonly items: Array<T>
  /**
   * Indicates whether or not the _collection contains a record with a given primary key
   * @param primaryKey The primary key whose existence will be checked
   * @returns true if the primary key is present, false otherwise
   */
  has(primaryKey: any): boolean
  /**
   * Get a record instance in the _collection form its primary key
   * @param primaryKey the reocrd's primary key value
   * @return The record instance or undefined if there is no record with the given primary key
   */
  get(primaryKey: PrimaryKey): T
  wherePropEq(propName: keyof T, propValue: any): T[]
  /**
   * Get multiple record instances in the _collection form their primary keys
   * @param primaryKeyList the reocrds' primary key values
   */
  getMany(primaryKeyList: PrimaryKey[]): T[]
  /**
   * Get the size of the collection
   * @returns The number of (all) items in the collection
   */
  readonly size: number
  /**
   * Add or replace one record in the collection
   * @param recordProperties A plain object reprsentation of the record's properties
   * @param strict Indicates whether or not the method should throw an exception
   * if one of the provided recordProperties keys is not defined
   * as being a property of the Record subclass associated with the colection
   */
  set(recordProperties: Partial<T>, strict?: boolean): T
  /**
   * Add or replace one record in the collection
   * @param recordInstance The record instance to set in the collection
   */
  setRecord(recordInstance: T): T
  /**
   * Updates the index of the a record with a primaryKeyValue of oldPk (if found)
   * in the collection's records' map
   * @param oldPk the index to be replaced
   * @param newPk the new value of the index
   */
  updateRecordPrimaryKey(oldPk: PrimaryKey, newPk: PrimaryKey): void
  /**
   * Add or replace multiple records in the _collection
   * @param recordPropertiesList An array of plain object reprsentation of the records' properties
   * @param strict Indicates whether or not the method should throw an exception
   * if one of the provided recordProperties keys is not defined
   * as being a property of the Record subclass associated with the colection
   */
  setMany(recordPropertiesList: Partial<T>[], strict?: boolean): T[]
  /**
   * Delete a record with a given primary key in the _collection
   * @param primaryKey The identifier of the record to delete from the _collection
   */
  unset(primaryKey: PrimaryKey): this
  /**
   * Delete multipe records in the _collection form their primary keys
   * @param primaryKeyList The identifiers of the records to delete from the _collection
   */
  unsetMany(primaryKeyList: PrimaryKey[]): this
  /**
   * Delete all the records in the _collection
   */
  clear(): this
}
