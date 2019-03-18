import { Record, PrimaryKey, Collection, PersistenceServiceName } from "./internals"
/**
 * A subset of a collection
 */
export declare class Scope<RecordType extends Record> {
  /**
   * Holds an ordered list of records primary keys
   */
  itemPrimaryKeys: PrimaryKey[]
  /**
   * Either false or the persistence service currently used to fetch the items
   * You can use this for exemple to differentiate data loaded form local app storage or a remote API
   */
  loadingFrom: PersistenceServiceName | boolean
  /**
   * Either false or the persistence service lastly used to fetch the items
   * You can use this for exemple to differentiate data loaded form local app storage or a remote API
   */
  lastLoadedFrom: PersistenceServiceName | boolean
  /**
   * Either null or the time when the scope was lastely loaded
   * You can use this for exemple to decide if a scope can be returned from cache when you have to (re)load it
   */
  lastLoadedAt: Date | null
  /**
   * The name of the scope, can be any string
   */
  name: string
  /**
   * The parameters used to load the items
   * exemple : {status: 'active'}
   */
  params: object
  /**
   * The scope's collection
   */
  collection: Collection<RecordType>
  constructor(collection: Collection<RecordType>, name?: string, params?: object)
  /**
   * Sets the scope's paramaters
   * @param {object} params
   * @return {this<RecordType extends Record>}
   */
  setParams(params: object): this
  /**
   * Load items for this scope into the scope's collection
   * @param {object} params Optionnaly provide params to load the scope.
   * If none is specified, internal params set with 'setParms' wil be passed to the collection's 'load' method
   * @return {Promise<any>}
   */
  load(params?: object): Promise<any>
  /**
   * returns true if the scope contains the pk
   */
  hasPk(pk: PrimaryKey): boolean
  /**
   * adds primary key in the scope's pk list, if the latter is not already there
   */
  addPk(pk: PrimaryKey): this
  /**
   * replace primary key in the scope's pk list by another one
   */
  replacePk(oldpk: PrimaryKey, newPk: PrimaryKey): this
  /**
   * Removes a pk form the set
   * @param {PrimaryKey} pk
   * @return {Scope<RecordType extends Record>}
   */
  removePk(pk: PrimaryKey): Scope<RecordType>
  /**
   * get the scope items instances
   */
  readonly items: RecordType[]
}
