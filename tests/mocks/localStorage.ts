// Most of local storages ar just key-value stores
let fakeLocalStorageDB = {}

const LocalStorageMock = {
  getItem(
    key: string,
    callback?: (error: any, result: any) => void
  ): Promise<any> {
    if (callback) {
      callback(null, fakeLocalStorageDB[key])
    }
    return Promise.resolve(fakeLocalStorageDB[key])
  },
  setItem(
    key: string,
    value: any,
    callback?: (error: any) => void
  ): Promise<any> {
    fakeLocalStorageDB[key] = value
    if (callback) {
      callback(null)
    }
    return Promise.resolve(fakeLocalStorageDB[key])
  },
  removeItem(key: string, callback?: (error: any) => void): Promise<any> {
    delete fakeLocalStorageDB[key]
    if (callback) {
      callback(null)
    }
    return Promise.resolve()
  },
  clear(callback?: (error: any) => void): Promise<any> {
    fakeLocalStorageDB = {}
    if (callback) {
      callback(null)
    }
    return Promise.resolve()
  }
}

export default LocalStorageMock
