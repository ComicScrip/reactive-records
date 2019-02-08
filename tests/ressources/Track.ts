import { observable } from "mobx"
import { BaseRecordAttributes } from "../internals"
import {
  ownAttribute,
  Collection,
  Record,
  PrimaryKey
} from "../../src/internals"

export interface TrackAttributes extends BaseRecordAttributes {
  name: string
  duration: number
}

export class Track extends Record implements TrackAttributes {
  @observable
  @ownAttribute
  id: number
  @observable
  @ownAttribute
  duration: number = 0
  @observable
  @ownAttribute
  name: string = ""
  @observable
  @ownAttribute
  album_id: PrimaryKey
}

export class TrackCollection extends Collection<Track> {
  get recordClass(): typeof Track {
    return Track
  }
}

export const trackCollection = new TrackCollection()
