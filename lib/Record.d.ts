import { Collection, toManyAssociationsDescription } from "./internals"
import {
  toOneAssociationsDescription,
  OptimisticPrimaryKey,
  PrimaryKey,
  Partial
} from "./types"
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
  _realPrimaryKey: PrimaryKey
  /**
   * Get the identifier of the record
   */
  readonly _primaryKeyValue: PrimaryKey
  /**
   * The field that is used to uniquely identify a record among the other records of the same type
   */
  static primaryKeyName: string
  /**
   * The store holding the record's instance in its 'records' field
   */
  _collection: Collection<Record> | null
  /**
   *
   */
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
}
