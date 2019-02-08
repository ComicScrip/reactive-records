import { observable } from "mobx"
import { Collection, Record, ownAttribute } from "../../src/internals"

export interface BaseRecordAttributes {
  id: number
}

export class BaseRecord extends Record {
  @observable
  _collection
  @observable
  @ownAttribute
  id: string
}

class BaseCollection extends Collection<Record> {
  get recordClass(): typeof BaseRecord {
    return BaseRecord
  }
}

export const baseCollection = new BaseCollection()
