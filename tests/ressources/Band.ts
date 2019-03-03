import { observable } from "mobx"
import { Collection, Record, ownAttribute, toManyAssociation } from "../../src/internals"
import { BaseRecordAttributes, Artist, ArtistAttributes, artistCollection } from "../internals"

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
  @toManyAssociation({
    foreignCollection: () => artistCollection,
    foreignKeyAttribute: "band_id"
  })
  members: Array<Artist>
}

export class BandCollection extends Collection<Band> {
  get recordClass(): typeof Band {
    return Band
  }
}

export const bandCollection = new BandCollection()
