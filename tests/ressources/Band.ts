import { observable } from "mobx"
import { Collection, Record, ownAttribute } from "../../src/internals"
import {
  BaseRecordAttributes,
  Artist,
  ArtistAttributes,
  ArtistCollection,
  artistCollection
} from "../internals"

export interface BandAttributes extends BaseRecordAttributes {
  name: string
  members: Array<ArtistAttributes>
}

export class Band extends Record implements BandAttributes {
  @observable
  @ownAttribute
  id: number
  @observable
  @ownAttribute
  name: string = ""
  @observable
  /*
  @association({
    foreignCollection: () => artistCollection,
    type: "toMany",
    foreignKeyAttribute: "member_ids"
  })*/
  members: Array<Artist>
}

export class BandCollection extends Collection<Band> {
  get recordClass(): typeof Band {
    return Band
  }
}

export const bandCollection = new BandCollection()
