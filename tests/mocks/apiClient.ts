import { PersistenceService } from "../../src/types"

export class ApiClient {
  static baseUrl = "http://myapi.net"

  static apiAdapter = {
    get: (url: string, params: object) => {},
    put: (url: string, params: object) => {},
    post: (url: string, params: object) => {},
    delete: (url: string, params: object) => {}
  }

  static createCRUDHandlers(collectionUrl): PersistenceService {
    return {
      name: "RESTAPI",

      async loadMany(params, scope) {
        return ApiClient.apiAdapter.get(
          ApiClient.baseUrl + collectionUrl,
          params
        )
      },
      async loadOne(params, record, scope) {
        return ApiClient.apiAdapter.get(
          ApiClient.baseUrl + collectionUrl + record._primaryKeyValue,
          params
        )
      },
      async saveOne(params, record, scope) {
        if (record._realPrimaryKey) {
          return ApiClient.apiAdapter.put(
            ApiClient.baseUrl + collectionUrl + record._realPrimaryKey,
            record._ownAttributes
          )
        } else {
          return ApiClient.apiAdapter.post(
            ApiClient.baseUrl + collectionUrl,
            record._ownAttributes
          )
        }
      },
      async destroyOne(params, record, scope) {
        return ApiClient.apiAdapter.delete(
          ApiClient.baseUrl + collectionUrl + record._realPrimaryKey,
          params
        )
      }
    }
  }
}
