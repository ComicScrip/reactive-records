import { action, computed, observable } from "mobx"
import * as Bluebird from "bluebird"
Promise = Bluebird as any
import { Record, Partial, PrimaryKey, Collection, PersistenceServiceName } from "./internals"

/**
 * A subset of a collection
 */
export class Scope<RecordType extends Record> {
  /**
   * Holds an ordered list of records primary keys
   */
  @observable
  public itemPrimaryKeys: PrimaryKey[] = []

  /**
   * Either false or the persistence service currently used to fetch the items
   * You can use this for exemple to differentiate data loaded form local app storage or a remote API
   */
  @observable
  public loadingFrom: PersistenceServiceName | boolean = false

  /**
   * Either false or the persistence service lastly used to fetch the items
   * You can use this for exemple to differentiate data loaded form local app storage or a remote API
   */
  @observable
  public lastLoadedFrom: PersistenceServiceName | boolean = false

  /**
   * Either false or the persistence service lastly used to fetch the items
   * You can use this for exemple to differentiate data loaded form local app storage or a remote API
   */
  @observable
  public lastLoadedAt: PersistenceServiceName | boolean = false

  /**
   * The name of the scope, can be any string
   */
  public name: string

  /**
   * The parameters used to load the items
   * exemple : {status: 'active'}
   */
  public params: object

  /**
   * The scope's collection
   */
  public collection: Collection<RecordType>

  constructor(collection: Collection<RecordType>, name: string = "default", params: object = {}) {
    this.params = params
    this.name = name
    this.collection = collection
  }

  /**
   * Sets the scope's paramaters
   * @param {object} params
   * @return {this<RecordType extends Record>}
   */
  @action.bound
  public setParams(params: object) {
    this.params = params
    return this
  }

  /**
   * Load items for this scope into the scope's collection
   * @param {object} params
   * @return {Promise<any>}
   */
  @action.bound
  public load(params?: object): Promise<any> {
    return this.collection.load(params ? params : this.params, this.name)
  }

  /**
   * returns true if the scope contains the pk
   */
  public hasPk(pk: PrimaryKey) {
    return this.itemPrimaryKeys.findIndex(p => p == pk) !== -1
  }

  /**
   * adds primary key in the scope's pk list, if the latter is not already there
   */
  public addPk(pk: PrimaryKey) {
    if (!this.hasPk(pk)) {
      this.itemPrimaryKeys.push(pk)
    }

    return this
  }

  /**
   * replace primary key in the scope's pk list by another one
   */
  public replacePk(oldpk: PrimaryKey, newPk: PrimaryKey) {
    const pkIndex = this.itemPrimaryKeys.findIndex(p => p == oldpk)
    if (pkIndex !== -1) {
      this.itemPrimaryKeys[pkIndex] = newPk
    }
    return this
  }

  /**
   * Removes a pk form the set
   * @param {PrimaryKey} pk
   * @return {Scope<RecordType extends Record>}
   */
  public removePk(pk: PrimaryKey): Scope<RecordType> {
    const idx = this.itemPrimaryKeys.findIndex(p => p == pk)
    if (idx !== -1) {
      this.itemPrimaryKeys.splice(idx, 1)
    }
    return this
  }

  /**
   * get the scope items instances
   */
  @computed
  get items(): RecordType[] {
    const result = []

    for (let i = 0; i < this.itemPrimaryKeys.length; i++) {
      const item = this.collection.get(this.itemPrimaryKeys[i])
      if (item) {
        result.push(item)
      }
    }

    return result
  }
}
