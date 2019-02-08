import { computed, observable } from "mobx"
import {
  Collection,
  Record,
  ownAttribute,
  toOneAssociation
} from "../../src/internals"
import { BaseRecordAttributes, Band, bandCollection } from "../internals"

export interface ArtistAttributes extends BaseRecordAttributes {
  firstName: string
  lastName: string
  birthDate?: string
  bio?: string
}

export class Artist extends Record implements ArtistAttributes {
  @observable
  @ownAttribute
  id: number
  @observable
  @ownAttribute
  bio: string = "No bio for this artist yet"
  @observable
  @ownAttribute
  birthDate: string
  @observable
  @ownAttribute
  firstName: string = ""
  @observable
  @ownAttribute
  lastName: string = ""
  @observable
  @toOneAssociation({
    foreignKeyAttribute: "band_id",
    foreignCollection: () => bandCollection
  })
  band: Band
  @observable
  @ownAttribute
  band_id: number

  @computed
  public get fullName() {
    return this.firstName + " " + this.lastName
  }
}

export class ArtistCollection extends Collection<Artist> {
  get recordClass(): typeof Artist {
    return Artist
  }
}

export const artistCollection = new ArtistCollection()
