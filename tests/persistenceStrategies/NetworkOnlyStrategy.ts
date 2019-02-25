import {
  PersistenceService,
  PersistenceServiceName,
  PersistenceStrategy
} from "../../src/types"
import { Record } from "../../src"
import { Scope } from "../../src/Scope"

export class NetworkOnlyStrategy implements PersistenceStrategy {
  persistenceServices: Map<PersistenceServiceName, PersistenceService>

  async loadMany(params: object, scope: Scope<Record>): Promise<any> {
    const { collection } = scope
    let records = []

    try {
      scope.loadingFrom = "RESTAPI"
      records = ((await this.persistenceServices
        .get("RESTAPI")
        .loadMany(params, scope)) || []) as Record[]
      collection.setMany(records)
      scope.itemPrimaryKeys = records.map(
        r => r[collection.recordClass.primaryKeyName]
      )
      scope.lastLoadedFrom = "RESTAPI"
    } catch (e) {
      console.error(e)
    }

    return records
  }

  async loadOne(
    params: object,
    record: Record,
    scope: Scope<Record>
  ): Promise<any> {
    const { collection } = scope
    let fetchedRecord = {}

    try {
      scope.loadingFrom = "RESTAPI"
      fetchedRecord = ((await this.persistenceServices
        .get("RESTAPI")
        .loadOne(params, record, scope)) || {}) as Record
      collection.set(fetchedRecord)
      scope.addPk(fetchedRecord[record._collection.recordClass.primaryKeyName])
      scope.lastLoadedFrom = "RESTAPI"
    } catch (e) {
      console.error(e)
    }

    return fetchedRecord
  }

  async saveOne(
    params: object,
    record: Record,
    scope: Scope<Record>
  ): Promise<any> {
    const { collection } = scope
    const newRecord = record._realPrimaryKey === null
    let savedRecord = {}

    try {
      savedRecord = ((await this.persistenceServices
        .get("RESTAPI")
        .saveOne(params, record, scope)) || {}) as Record
      collection.set(savedRecord)
      if (newRecord) {
        scope.addPk(savedRecord[record._collection.recordClass.primaryKeyName])
      }
    } catch (e) {
      console.error(e)
    }

    return savedRecord
  }

  destroyOne(
    params: object,
    record: Record,
    scope: Scope<Record>
  ): Promise<any> {
    return undefined
  }
}
