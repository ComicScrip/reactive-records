import { action, computed, intercept, observable, reaction } from "mobx"
import { keys, isObject, isEmpty, isArray, includes, clone } from "lodash"
import { Collection, PersistenceServiceName, toManyAssociationsDescription } from "./internals"
import { toOneAssociationsDescription, OptimisticPrimaryKey, PrimaryKey, Partial } from "./types"
import { type } from "os"

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min
}

export class Record {
  /**
   * A uniquely generated identifier for the record.
   * Used for exemple when creating a new record locally that's not saved on a backend yet.
   */
  @observable
  public _optimisticPrimaryKey: OptimisticPrimaryKey =
    "optimistic_" + getRandomArbitrary(0, 9999999999999999999)

  /**
   * Holds the real identifier of the record
   * Usually, it's the identifier fetched from the application's backend
   */
  @observable
  public _realPrimaryKey: PrimaryKey | null = null

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
   * Either null or the time when the record was lastely loaded
   * You can use this for exemple to decide if a record can be returned from cache when you have to (re)load it
   */
  @observable
  public _lastLoadedAt: Date | null = null

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
      const shouldMerge =
        typeof associationDesc.mergePropsOnAssignation === "function"
          ? associationDesc.mergePropsOnAssignation()
          : !!associationDesc.mergePropsOnAssignation
      const foreignCollection = associationDesc.foreignCollection()
      if (!(foreignCollection instanceof Collection)) {
        throw new Error(
          `foreign collection not valid, please check the 'foreignCollection' parameter of @toOneAssociation decorator on ${associationName} attribute`
        )
      }

      let foreignKey: string = associationDesc.foreignKeyAttribute
      if (isEmpty(foreignKey)) {
        // give it a default name if none was specified
        foreignKey = `${associationName}_${foreignCollection.recordClass.primaryKeyName}`
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
            newValue = shouldMerge
              ? foreignCollection.merge(newValue)
              : foreignCollection.set(newValue)
          }
          this[foreignKey] = !!newValue ? newValue._primaryKeyValue : newValue
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
      const shouldMerge =
        typeof associationDesc.mergePropsOnAssignation === "function"
          ? associationDesc.mergePropsOnAssignation()
          : !!associationDesc.mergePropsOnAssignation

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
        foreignKey = `${thisClassName}_${this._collection.recordClass.primaryKeyName}`
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
            change.added[j] = shouldMerge
              ? foreignCollection.merge(pushed)
              : foreignCollection.set(pushed)
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
            change.newValue = shouldMerge
              ? foreignCollection.merge(change.newValue)
              : foreignCollection.set(change.newValue)
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
            foreignCollection.wherePropEq(foreignKey as keyof Record, this._primaryKeyValue)
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
              if (!newValuesPkBoolMap[existingAssociatedRecords[j]._primaryKeyValue]) {
                existingAssociatedRecords[j][foreignKey] = null
              }
            }
            if (shouldMerge) {
              foreignCollection.mergeMany(recordsToSet)
            } else {
              foreignCollection.setMany(recordsToSet)
            }
          } else {
            throw new Error('You tried to assign a non array to a "toMany" association')
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
   * Merges given properties on the record
   * @param properties a plain object with the properties that will override this record's properties
   */
  @action.bound
  public _mergeProperties(properties: Partial<this>): this {
    for (let i = 0, propKeys = keys(properties); i < propKeys.length; i++) {
      const propKey = propKeys[i]
      this[propKey] = properties[propKey]
    }

    return this
  }

  /**
   * Tries to populate all this record's declared properties (ownAttributes & associations) with a plain object
   * Contrary to _mergeProperties, here we iterate over this record's properties.
   * @param properties a plain object with the properties that will override this record's properties
   */
  @action.bound
  public _hydrateWith(properties: Partial<this>): this {
    for (let i = 0, propKeys = this._propertiesNames; i < propKeys.length; i++) {
      const propKey = propKeys[i]
      this[propKey] = properties[propKey]
    }
    return this
  }

  /**
   * Tries to populate the graph object in paramters with the record's properties
   * @param graph The object that will be mutated in order to recursively populate its properties with values form this record
   * @returns The populated given graph object with the records's poperties and its associated records properties
   */
  public _populate(graph: object): object {
    const ks = keys(graph)
    const toOneAssociationNames = this._toOneAssociationsNames
    const toManyAssociationNames = this._toManyAssociationsNames
    for (let i = 0; i < ks.length; i++) {
      const k = ks[i]
      if (isObject(graph[k])) {
        if (includes(toOneAssociationNames, k)) {
          if (this[k] && typeof this[k]._populate === "function") {
            this[k]._populate(graph[k])
          }
        } else if (includes(toManyAssociationNames, k)) {
          const associatedDesc = graph[k]
          graph[k] = []
          const numberOfAssociatedRecords = this[k].length
          for (let j = 0; j < numberOfAssociatedRecords; j++) {
            const associatedRecord = this[k][j]
            graph[k][j] = clone(associatedDesc)
            associatedRecord._populate(graph[k][j])
          }
        }
      } else if (this[k] !== undefined) {
        graph[k] = this[k]
      }
    }
    return graph
  }

  /**
   * Calls the record's collection 'loadOne' method with provided params
   * @param {object} params : params passed to the 'loadOne' method of the collection's persistence strategy
   * @param {string} scopeName : The name of the scope the item should be loaded into
   */
  @action.bound
  public async _load(params: any = {}, scopeName: string = "default") {
    return this._collection.loadOne(this, params, scopeName)
  }

  /**
   * Calls the record's collection 'saveOne' method with provided params
   * @param {object} params : params passed to the 'saveOne' method of the collection's persistence strategy
   * @param {string} scopeName : The name of the scope the item should be saved into
   */
  @action.bound
  public async _save(params: any = {}, scopeName: string = "default") {
    return this._collection.saveOne(this, params, scopeName)
  }

  /**
   * Calls the record's collection 'saveOne' method with provided params
   * @param {object} params : params passed to the 'destroyOne' method of the collection's persistence strategy
   * @param {string} scopeName : The name of the scope the item should deleted from
   */
  @action.bound
  public async _destroy(params: any = {}, scopeName: string = "default") {
    return this._collection.destroyOne(this, params, scopeName)
  }
}
