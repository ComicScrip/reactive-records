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
  private records
  /**
   * Get the collection's records' constructor
   */
  abstract readonly recordClass: typeof Record
  /**
   * The collection's scopes
   * @type {Map}
   */
  private scopes
  persistenceStrategy: PersistenceStrategy
  getPersistanceStrategy(): PersistenceStrategy
  /**
   * Get a collection scope by name
   * @param {string} name : the name of the scope
   * @return {Scope<RecordType extends Record>}
   */
  getScope(name: string): Scope<RecordType> | undefined
  /**
   * Get an existing scope or create a new one
   * @param {string} name : The name of the scope
   * @param {object} params : the scope's params to be set if specified
   * @return {Scope<RecordType extends Record>}
   */
  provideScope(name?: string, params?: object): Scope<RecordType>
  /**
   * Set a scope into the collection's scope set
   * @param {Scope<RecordType extends Record>} scope
   */
  setScope(scope: Scope<RecordType>): void
  /**
   * Set the collection's persistence strategy
   * @param ps {PersistenceStrategy} : The persistence strategy to set
   * @return {Collection<Record>} : The collection
   */
  setPersistenceStratgy(ps: PersistenceStrategy): this
  readonly itemsPrimaryKeys: PrimaryKey[]
  /**
   * Get a list of the _collection's record instances
   * @returns An array of Record instances
   */
  readonly items: Array<RecordType>
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
  get(primaryKey: PrimaryKey): RecordType
  wherePropEq(propName: keyof RecordType, propValue: any): RecordType[]
  /**
   * Get multiple record instances in the _collection form their primary keys
   * @param primaryKeyList the reocrds' primary key values
   */
  getMany(primaryKeyList: PrimaryKey[]): RecordType[]
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
  set(recordProperties: Partial<RecordType>, strict?: boolean): RecordType
  /**
   * Add or replace one record in the collection
   * @param recordInstance The record instance to set in the collection
   */
  setRecord(recordInstance: RecordType): RecordType
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
  setMany(recordPropertiesList: Partial<RecordType>[], strict?: boolean): RecordType[]
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
  /**
   * Loads items into the collection using the collection's persitence strategy
   */
  load(params?: object, scopeName?: string): Promise<any>
  /**
   * Loads a record into the collection using the collection's persitence strategy
   */
  loadOne(record: Record | PrimaryKey, params?: object, scopeName?: string): Promise<any>
  /**
   * Saves one record into the collection using the collection's persitence strategy
   */
  saveOne(record: Record, params?: object, scopeName?: string): Promise<any>
  /**
   * Destroys one record into the collection using the collection's persitence strategy
   */
  destroyOne(record: Record, params?: object, scopeName?: string): Promise<any>
}
