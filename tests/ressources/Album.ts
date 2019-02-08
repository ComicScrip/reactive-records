import { computed, observable } from "mobx"
import {
  Record,
  Collection,
  ownAttribute,
  PrimaryKey,
  Partial
} from "../../src/index"
import {
  BaseRecordAttributes,
  Band,
  BandAttributes,
  Track,
  TrackAttributes,
  bandCollection,
  trackCollection
} from "../internals"
import { toOneAssociation, toManyAssociation } from "../../src/decorators"

export interface AlbumAttributes extends BaseRecordAttributes {
  name: string
  tracks: Array<Partial<TrackAttributes>>
  coverUrl: string
}

export class Album extends Record implements AlbumAttributes {
  @observable
  @ownAttribute
  id: number

  @observable
  @ownAttribute
  coverUrl: string

  @observable
  @ownAttribute
  name: string

  @observable
  @ownAttribute
  releaseDate: Date

  @toOneAssociation({
    foreignCollection: () => bandCollection,
    foreignKeyAttribute: "band_id"
  })
  band: Partial<Band>

  @observable
  @ownAttribute
  band_id: PrimaryKey

  @toManyAssociation<Track>({
    foreignKeyAttribute: "album_id",
    foreignCollection: () => trackCollection
  })
  tracks: Array<Partial<Track>> = []

  @computed
  get duration() {
    return this.tracks
      .map(track => track.duration)
      .reduce((acc, current) => acc + current, 0)
  }

  @computed
  get nameWithReleaseYear() {
    return `${this.name} (${this.releaseDate.getFullYear()})`
  }
}

export class AlbumCollection extends Collection<Album> {
  get recordClass(): typeof Album {
    return Album
  }
}

export const albumCollection = new AlbumCollection()
