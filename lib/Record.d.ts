import { Collection, PersistenceServiceName, toManyAssociationsDescription } from "./internals"
import { toOneAssociationsDescription, OptimisticPrimaryKey, PrimaryKey, Partial } from "./types"
export declare class Record {
  /**
   * A uniquely generated identifier for the record.
   * Used for exemple when creating a new record locally that's not saved on a backend yet.
   */
  _optimisticPrimaryKey: OptimisticPrimaryKey
  /**
   * Holds the real identifier of the record
   * Usually, it's the identifier fetched from the application's backend
   */
  _realPrimaryKey: PrimaryKey | null
  /**
   * Get the identifier of the record
   */
  readonly _primaryKeyValue: PrimaryKey
  /**
   * The field that is used to uniquely identify a record among the other records of the same type
   */
  static primaryKeyName: string
  /**
   * Either false or the persistence service currently used to fetch the record
   * You can use this for exemple to differentiate data loaded form local app storage or a remote API
   */
  _loadingFrom: PersistenceServiceName | boolean
  /**
   * Either false or the persistence service lastly used to fetch the record
   * You can use this for exemple to differentiate data loaded form local app storage or a remote API
   */
  _lastLoadedFrom: PersistenceServiceName | boolean
  /**
   * Either null or the time when the record was lastely loaded
   * You can use this for exemple to decide if a record can be returned from cache when you have to (re)load it
   */
  _lastLoadedAt: Date | null
  /**
   * The store holding the record's instance in its 'records' field
   */
  _collection: Collection<Record> | null
  /**
   * Instanciate a new Record
   * @param collection The foreignCollection instance holding the record
   */
  constructor(collection: Collection<Record>)
  /**
   * Sets up automatic association instance building when assigning a value to
   * a member decorated with @toOneAssociation
   */
  protected __configureToOneAssociations(): void
  /**
   * Sets up automatic association instance building when assigning a value to
   * a member decorated with @toOneAssociation
   */
  protected __configureToManyAssociations(): void
  protected __configurePrimaryKeyAssignations(): void
  /**
   * Get a record's _ownAttributes names
   * @returns An array containing all members' name decorated with @ownAttribute
   */
  readonly _ownAttributesNames: string[]
  /**
   * Get a record's _ownAttributes' keys and values
   * @returns An plain object representation of the record's _ownAttributes
   */
  readonly _ownAttributes: object
  /**
   * Get a list of the record's 'toOne' associations names
   * @returns An array containing all members' name decorated with @toOneAssociation decorator
   */
  readonly _toOneAssociationsNames: string[]
  /**
   * Get a map of description objects of the record's members decorated with @toOneAssociation
   * @returns An object indexed by 'toOne' association names, values of the object are association descriptions
   */
  readonly _toOneAssociations: toOneAssociationsDescription<Record>
  /**
   * Get a map of description objects of the record's members decorated with @toOneAssociation
   * @returns An object indexed by 'toOne' association names, values of the object are association descriptions
   */
  readonly _toManyAssociations: toManyAssociationsDescription<Record>
  /**
   * Get a list of the record's 'toMany' associations names
   * @returns An array containing all members' name decorated with @toManyAssociation decorator
   */
  readonly _toManyAssociationsNames: string[]
  /**
   * Get a list of all the properties names of a record (including its _ownAttributes, its _toOneAssociations and its _toManyAssociations)
   * @returns an array of all record's members decorated with @ownAttributes or @toOneAssociation or @toManyAssociation decorators
   */
  readonly _propertiesNames: string[]
  /**
   * Tells whether a given property name has been declared as a property of the record
   * @param propNameToCheck The property name whose existence should be checked in the record
   * @returns true if the record has a declared propery named like 'propNameToCheck', false otherwise
   */
  _hasProperty(propNameToCheck: any): boolean
  /**
   * Safely merges given properties with the record's declared properties
   * Only declared _ownAttributes or _toOneAssociations prop keys will be merged.
   * If a key in given properties parameter has not been delared as a property within the record,
   * an error will be thrown unless the 'strict' param is set to false
   * @param properties
   * @param strict Indicates if an an error should be thrown when a key that is not supposed to exist in the 'properties' param
   */
  _mergeProperties(properties: Partial<this>, strict?: boolean): this
  /**
   * Calls the record's collection 'loadOne' method with provided params
   * @param {object} params : params passed to the 'loadOne' method of the collection's persistence strategy
   * @param {string} scopeName : The name of the scope the item should be loaded into
   */
  _load(params?: any, scopeName?: string): Promise<any>
  /**
   * Calls the record's collection 'saveOne' method with provided params
   * @param {object} params : params passed to the 'saveOne' method of the collection's persistence strategy
   * @param {string} scopeName : The name of the scope the item should be saved into
   */
  _save(params?: any, scopeName?: string): Promise<any>
  /**
   * Calls the record's collection 'saveOne' method with provided params
   * @param {object} params : params passed to the 'destroyOne' method of the collection's persistence strategy
   * @param {string} scopeName : The name of the scope the item should deleted from
   */
  _destroy(params?: any, scopeName?: string): Promise<any>
  /**
   * Tries to populate the graph object in paramters with the record's properties
   * @returns The populated given graph object with the records's Poperties and eventually its associated records properties
   */
  _populate(graph: object): object
}
