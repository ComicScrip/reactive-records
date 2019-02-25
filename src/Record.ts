import { action, computed, intercept, observable, reaction } from "mobx"
import { uniqueId, keys, isObject, isEmpty, isArray } from "lodash"
import {
  Collection,
  PersistenceServiceName,
  toManyAssociationsDescription
} from "./internals"
import {
  toOneAssociationsDescription,
  OptimisticPrimaryKey,
  PrimaryKey,
  Partial
} from "./types"

export class Record {
  /**
   * A uniquely generated identifier for the record.
   * Used for exemple when creating a new record locally that's not saved on a backend yet.
   */
  @observable
  public _optimisticPrimaryKey: OptimisticPrimaryKey = uniqueId("optimistic_")

  /**
   * Holds the real identifier of the record
   * Usually, it's the identifier fetched from the application's backend
   */
  @observable
  public _realPrimaryKey: PrimaryKey = null

  /**
   * Get the identifier of the record
   */
  @computed
  public get _primaryKeyValue(): PrimaryKey {
    return this._realPrimaryKey || this._optimisticPrimaryKey
  }

  /**
   * The field that is used to uniquely identify a record among the other records of the same type
   */
  public static primaryKeyName = "id"

  /**
   * Either false or the persistence service currently used to fetch the record
   * You can use this for exemple to differentiate data loaded form local app storage or a remote API
   */
  @observable
  public _loadingFrom: PersistenceServiceName | boolean = false

  /**
   * Either false or the persistence service lastly used to fetch the record
   * You can use this for exemple to differentiate data loaded form local app storage or a remote API
   */
  @observable
  public _lastLoadedFrom: PersistenceServiceName | boolean = false

  /**
   * The store holding the record's instance in its 'records' field
   */
  public _collection: Collection<Record> | null = null

  /**
   * Instanciate a new Record
   * @param collection The foreignCollection instance holding the record
   */
  constructor(collection: Collection<Record>) {
    if (!(collection instanceof Collection)) {
      throw new Error("You must give a valid collection to create a Record")
    }
    this._collection = collection
    collection.setRecord(this)
    this.__configurePrimaryKeyAssignations()
    this.__configureToOneAssociations()
    this.__configureToManyAssociations()
  }

  /**
   * Sets up automatic association instance building when assigning a value to
   * a member decorated with @toOneAssociation
   */
  protected __configureToOneAssociations() {
    for (let i = 0; i < this._toOneAssociationsNames.length; i++) {
      const associationName = this._toOneAssociationsNames[i]
      const associationDesc = this._toOneAssociations[associationName]
      const foreignCollection = associationDesc.foreignCollection()
      if (!(foreignCollection instanceof Collection)) {
        throw new Error(
          `foreign collection not valid, please check the 'foreignCollection' parameter of @toOneAssociation decorator on ${associationName} attribute`
        )
      }

      let foreignKey: string = associationDesc.foreignKeyAttribute
      if (isEmpty(foreignKey)) {
        // give it a default name if none was specified
        foreignKey = `${associationName}_${
          foreignCollection.recordClass.primaryKeyName
        }`
      }

      let foreignPkTrakingDisposer = () => {}
      const trackForeignRecordPk = () => {
        // the purpose of this function is to keep
        // this record's foreign key attribute up to date when
        // the foreign record's pk changes
        const foreignRecord = foreignCollection.get(this[foreignKey])
        if (foreignRecord) {
          const lastpk = foreignRecord._primaryKeyValue
          foreignPkTrakingDisposer()
          foreignPkTrakingDisposer = reaction(
            () => foreignRecord._primaryKeyValue,
            pk => {
              // force the foreign collection to update itself
              // if we don't do this, 'this[foreignKey] = pk' below
              // might trigger reactions of oberservers of the association attribute
              // and the oberservers might get an undefined value
              foreignCollection.updateRecordPrimaryKey(lastpk, pk)
              this[foreignKey] = pk
            }
          )
        }
      }

      Object.defineProperty(this, associationName, {
        get() {
          // delegate the retrival of the association attribute's value to the foreign collection
          // this way, the associated record will always be lazy loaded
          return foreignCollection.get(this[foreignKey])
        },
        set(newValue) {
          if (isObject(newValue) && !(newValue instanceof Record)) {
            // when doing "myRecord.assoc = {...}"
            // make a Record instance out of the POJO
            newValue = foreignCollection.set(newValue)
          }
          this[foreignKey] = newValue._primaryKeyValue
          trackForeignRecordPk()
        }
      })

      // if the association is changed by assigning a new value to the foreign key attribute
      // make sure we track the new associated record's primary key changes
      reaction(
        () => this[foreignKey],
        () => {
          trackForeignRecordPk()
        }
      )
    }
  }

  /**
   * Sets up automatic association instance building when assigning a value to
   * a member decorated with @toOneAssociation
   */
  protected __configureToManyAssociations() {
    for (let i = 0; i < this._toManyAssociationsNames.length; i++) {
      const associationName = this._toManyAssociationsNames[i]
      const associationDesc = this._toManyAssociations[associationName]

      const foreignCollection = associationDesc.foreignCollection()
      if (!(foreignCollection instanceof Collection)) {
        throw new Error(
          `foreign collection not valid, please check the 'foreignCollection' parameter of @toManyAssociation decorator on ${associationName} attribute`
        )
      }

      const thisClassName = this.constructor.name.toLowerCase()

      let foreignKey: string = associationDesc.foreignKeyAttribute
      if (isEmpty(foreignKey)) {
        // give it a default name if none was specified
        foreignKey = `${thisClassName}_${
          this._collection.recordClass.primaryKeyName
        }`
      }

      const trackForeignRecordPk = () => {
        // the purpose of this function is to keep
        // the foreign record's foreign key up to date with this record's pk
        const pkName = this._collection.recordClass.primaryKeyName
        let oldPkValue = this._primaryKeyValue

        intercept(this, pkName as keyof this, change => {
          const existingAssociatedRecords = foreignCollection.wherePropEq(
            foreignKey as keyof Record,
            oldPkValue
          )
          existingAssociatedRecords.forEach(r => {
            r[foreignKey] = change.newValue
          })
          oldPkValue = change.newValue
          return change
        })
      }

      const interceptArrayMutations = change => {
        // when doing myRecord.assoc.push(...) or myRecord.assoc[0] = ...
        const existingAssociatedRecords = foreignCollection.wherePropEq(
          foreignKey as keyof Record,
          this._primaryKeyValue
        )

        if (change.removedCount > 0) {
          const existingAssociatedRecords = foreignCollection.wherePropEq(
            foreignKey as keyof Record,
            this._primaryKeyValue
          )
          for (let j = change.index; j < change.removedCount; j++) {
            const removed = existingAssociatedRecords[j]
            removed[foreignKey] = null
          }
        }
        if (!isEmpty(change.added)) {
          for (let j = 0; j < change.added.length; j++) {
            const pushed = change.added[j]
            pushed[foreignKey] = this._primaryKeyValue
            change.added[j] = foreignCollection.set(pushed)
          }
        }
        if (change.type === "update") {
          const existingAssociatedRecords = foreignCollection.wherePropEq(
            foreignKey as keyof Record,
            this._primaryKeyValue
          )

          existingAssociatedRecords[change.index][foreignKey] = null

          if (change.newValue) {
            change.newValue[foreignKey] = this._primaryKeyValue
            change.newValue = foreignCollection.set(change.newValue)
          }
        }
        return change
      }

      Object.defineProperty(this, associationName, {
        get() {
          // delegate the retrival of the association attribute's value to the foreign collection
          // this way, the associated record will always be lazy loaded
          // the returned value needs to be an observable array in order to manage pushs, etc
          const a = observable.array(
            foreignCollection.wherePropEq(
              foreignKey as keyof Record,
              this._primaryKeyValue
            )
          )
          a.intercept(interceptArrayMutations)
          return a
        },
        set(newValues) {
          // when doing "myRecord.assoc = [{...}, {...}]"
          if (isArray(newValues)) {
            const recordsToSet = newValues
            const existingAssociatedRecords = foreignCollection.wherePropEq(
              foreignKey as keyof Record,
              this._primaryKeyValue
            )
            const newValuesPkBoolMap = {}
            for (let j = 0; j < newValues.length; j++) {
              const record = newValues[j]
              const pk =
                record instanceof Record
                  ? record._primaryKeyValue
                  : newValues[j][foreignCollection.recordClass.primaryKeyName]
              newValuesPkBoolMap[pk] = true
              recordsToSet[j][foreignKey] = this._primaryKeyValue
            }
            // we have to nullify foreign keys for exisiting associated records whose pk does not appear in new values
            for (let j = 0; j < existingAssociatedRecords.length; j++) {
              if (
                !newValuesPkBoolMap[
                  existingAssociatedRecords[j]._primaryKeyValue
                ]
              ) {
                existingAssociatedRecords[j][foreignKey] = null
              }
            }
            foreignCollection.setMany(recordsToSet, false)
          } else {
            throw new Error(
              'You tried to assign a non array to a "toMany" association'
            )
          }

          trackForeignRecordPk()
        }
      })
    }
  }

  protected __configurePrimaryKeyAssignations() {
    const constructor = this.constructor as any
    intercept(this, constructor.primaryKeyName, change => {
      const oldPk = this._primaryKeyValue
      this._realPrimaryKey = change.newValue || null
      this._collection.updateRecordPrimaryKey(oldPk, this._primaryKeyValue)
      return change
    })
  }

  /**
   * Get a record's _ownAttributes names
   * @returns An array containing all members' name decorated with @ownAttribute
   */
  public get _ownAttributesNames(): string[] {
    const c = this.constructor as any
    return c._ownAttributeNames
  }

  /**
   * Get a record's _ownAttributes' keys and values
   * @returns An plain object representation of the record's _ownAttributes
   */
  @computed
  public get _ownAttributes(): object {
    const ownAttributesObject = {}

    for (let i = 0; i < this._ownAttributesNames.length; i++) {
      const ownAttributesName = this._ownAttributesNames[i]
      ownAttributesObject[ownAttributesName] = this[ownAttributesName]
    }

    return ownAttributesObject
  }

  /**
   * Get a list of the record's 'toOne' associations names
   * @returns An array containing all members' name decorated with @toOneAssociation decorator
   */
  public get _toOneAssociationsNames(): string[] {
    return Object.keys(this._toOneAssociations)
  }

  /**
   * Get a map of description objects of the record's members decorated with @toOneAssociation
   * @returns An object indexed by 'toOne' association names, values of the object are association descriptions
   */
  public get _toOneAssociations(): toOneAssociationsDescription<Record> {
    const c = this.constructor as any
    return c._toOneAssociations || {}
  }

  /**
   * Get a map of description objects of the record's members decorated with @toOneAssociation
   * @returns An object indexed by 'toOne' association names, values of the object are association descriptions
   */
  public get _toManyAssociations(): toManyAssociationsDescription<Record> {
    const c = this.constructor as any
    return c._toManyAssociations || {}
  }

  /**
   * Get a list of the record's 'toMany' associations names
   * @returns An array containing all members' name decorated with @toManyAssociation decorator
   */
  public get _toManyAssociationsNames(): string[] {
    return Object.keys(this._toManyAssociations)
  }

  /**
   * Get a list of all the properties names of a record (including its _ownAttributes, its _toOneAssociations and its _toManyAssociations)
   * @returns an array of all record's members decorated with @ownAttributes or @toOneAssociation or @toManyAssociation decorators
   */
  public get _propertiesNames(): string[] {
    return [
      ...this._ownAttributesNames,
      ...this._toOneAssociationsNames,
      ...this._toManyAssociationsNames
    ]
  }

  /**
   * Tells whether a given property name has been declared as a property of the record
   * @param propNameToCheck The property name whose existence should be checked in the record
   * @returns true if the record has a declared propery named like 'propNameToCheck', false otherwise
   */
  public _hasProperty(propNameToCheck): boolean {
    for (let i = 0; i < this._propertiesNames.length; i++) {
      const propName = this._propertiesNames[i]
      if (propName === propNameToCheck) {
        return true
      }
    }

    return false
  }

  /**
   * Safely merges given properties with the record's declared properties
   * Only declared _ownAttributes or _toOneAssociations prop keys will be merged.
   * If a key in given properties parameter has not been delared as a property within the record,
   * an error will be thrown unless the 'strict' param is set to false
   * @param properties
   * @param strict Indicates if an an error should be thrown when a key that is not supposed to exist in the 'properties' param
   */
  @action.bound
  public _mergeProperties(properties: Partial<this>, strict = true): this {
    for (let i = 0, propKeys = keys(properties); i < propKeys.length; i++) {
      const propKey = propKeys[i]
      const propValue = properties[propKey]

      if (this._hasProperty(propKey)) {
        this[propKey] = propValue
      } else if (strict) {
        throw new Error(
          `Tried to assign something not defined in model '${
            this.constructor.name
          } associations or ownAttributes' : '${propKey}'`
        )
      }
    }

    return this
  }

  /**
   * Calls the record's collection 'loadOne' method with provided params
   * @param {string} scopeName : The name of the scope the item should be loaded into
   * @param {object} params : params passed to the persistence service
   */
  @action.bound
  public async _load(scopeName: string = "default", params: object) {
    return this._collection.loadOne(this, scopeName, params)
  }

  /**
   * Calls the record's collection 'saveOne' method with provided params
   * @param {string} scopeName : The name of the scope the item should be saved into
   * @param {object} params : params passed to the persistence service
   */
  @action.bound
  public async _save(scopeName: string = "default", params: object) {
    return this._collection.saveOne(this, scopeName, params)
  }

  /**
   * Calls the record's collection 'saveOne' method with provided params
   * @param {string} scopeName : The name of the scope the item should deleted from
   * @param {object} params : params passed to the persistence service
   */
  @action.bound
  public async _destroy(scopeName: string = "default", params: object) {
    return this._collection.destroyOne(this, scopeName, params)
  }

  /**
   * Get a record's plain object representation.
   * Associations can be expanded or kept as a primary key identifier
   * (or a list of primary keys when dealing with to many _toOneAssociations)
   * @returns An plain object representation of the record's _ownAttributes
   */

  /*
  public _toJS(
    options: toJSOptions = {
      expandAssociations: false,
      expandAssociationsLevels: null
    }
  ): object {
    const result = {}

    if (options.expandAssociations) {
    } else {
    }

    return result
  }
  */
}
