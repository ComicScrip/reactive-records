import { albumCollection as ac } from "./ressources/Album"
import { computed, observable, reaction, toJS } from "mobx"
import {
  toOneAssociation,
  Collection,
  ownAttribute,
  Partial,
  Record
} from "../src/internals"
import { Track, trackCollection } from "./ressources/Track"
import { Band, bandCollection } from "./ressources/Band"

const albumCollection = ac

export class User extends Record {
  @observable
  @ownAttribute
  id: number
  @observable
  @ownAttribute
  firstName: string
  @observable
  @ownAttribute
  lastName: string
  @observable
  @ownAttribute
  email: string

  @observable
  favorites: Track[]

  @computed
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`
  }
}

export class UserCollection extends Collection<User> {
  get recordClass(): typeof User {
    return User
  }
}

export const userCollection = new UserCollection()

describe("", () => {
  describe("toOneAssociations", () => {
    it("should work", () => {
      const album = albumCollection.set({
        name: "Exploding Plastic Inevitable"
      })
      // let's programm two reactions to see what's going on as we do the operations
      reaction(
        () => bandCollection.items,
        bands => {
          console.log(
            "-- bandCollection : [" +
              bands
                .map(band =>
                  JSON.stringify({
                    name: band.name,
                    pkValue: band._primaryKeyValue
                  })
                )
                .join(",") +
              "]"
          )
        }
      )
      reaction(
        () => ({
          band_id: album.band_id,
          bandName: album.band ? album.band.name : undefined
        }),
        albumState => {
          console.log(
            `-- album.band.name : ${albumState.bandName}, album.band_id : ${
              albumState.band_id
            }`
          )
        }
      )

      // The simpliest way to associate the album with a new band is
      // by assigning a POJO representation of the latter
      album.band = { name: "The Warlocks" }
      // the console logs :
      // -- bandCollection : [{"name":"The Warlocks","pkValue":"optimistic_2"}]
      // -- album.band.name : The Warlocks, album.band_id : optimistic_2
      // Notice that a new Band instance is created withing the dedicated collection
      // album.band now returns a reference to the Band instance
      // and album.band_id matches the optimistic identifier given to the band (since we did not provide an id)
      // let's now assume the band has been saved on the backend and a real identifier is available
      album.band.id = 123
      // the console logs :
      // -- bandCollection : [{"name":"The Warlocks","pkValue":123}]
      // -- album.band.name : The Warlocks, album.band_id : 123
      // Notice that album.band_id is kept in sync with band.id ! So you don't ever have to worry about having to update stale ids yourself.
      // You could also assign an existing band instance to the album
      const secondBand = bandCollection.set({
        name: "The Falling Spikes",
        id: 124
      })
      album.band = secondBand
      // the console logs :
      // -- bandCollection : [{"name":"The Warlocks","pkValue":123},{"name":"The Falling Spikes","pkValue":124}]
      // -- album.band.name : The Falling Spikes, album.band_id : 124
      // The last way of setting up an association is to update the 'foreignKeyAttribute' of the album
      const thirdBand = bandCollection.set({
        name: "The Velvet Underground",
        id: 125
      })
      album.band_id = thirdBand.id
      // the console logs :
      // -- bandCollection : [{"name":"The Warlocks","pkValue":123},{"name":"The Falling Spikes","pkValue":124},{"name":"The Velvet Underground","pkValue":125}]
      // -- album.band.name : The Velvet Underground, album.band_id : 125
    })
  })

  describe("to Many associations", () => {
    it("should work", () => {
      const album = albumCollection.set({
        name: "The Velvet Underground and Nico"
      })
      // let's programm two reactions to see what's going on as we do the operations
      reaction(
        () => album.tracks.map(t => t.name),
        trackNames =>
          console.log("-- album's tracks names: " + trackNames.join(", "))
      )
      reaction(
        () =>
          trackCollection.items.map(t => ({
            pkValue: t._primaryKeyValue,
            name: t.name,
            album_id: t.album_id
          })),
        tracks => {
          console.log(`-- tracksCollection ${JSON.stringify(tracks)}`)
        }
      )

      // The simpliest way to set an album's associated
      // by assigning a POJO representation of the latter
      album.tracks = [
        { name: "Sunday Morning" },
        { name: "Venus in Furs" }
      ] as Track[]
      // the console logs :
      // -- tracksCollection [
      //  {"pkValue":"optimistic_2","name":"Sunday Morning","album_id":"optimistic_1"},
      //  {"pkValue":"optimistic_3","name":"Venus in Furs","album_id":"optimistic_1"}
      // ]
      // -- album's tracks names: Sunday Morning, Venus in Furs
      // Like for 'toOne' associations, the albums set through the association are stored in the foreignCollection

      const otherTrack = trackCollection.set({ name: "All Tomorrow's Parties" })
      // the console logs :
      // -- tracksCollection [
      //   {"pkValue":"optimistic_2","name":"Sunday Morning","album_id":"optimistic_1"},
      //   {"pkValue":"optimistic_3","name":"Venus in Furs","album_id":"optimistic_1"},
      //   {"pkValue":"optimistic_4","name":"All Tomorrow's Parties"}
      // ]

      album.tracks = [otherTrack]
      // -- tracksCollection [
      //   {"pkValue":"optimistic_2","name":"Sunday Morning","album_id":null},
      //   {"pkValue":"optimistic_3","name":"Venus in Furs","album_id":null},
      //   {"pkValue":"optimistic_4","name":"All Tomorrow's Parties","album_id":"optimistic_1"}
      // ]
      // -- album's tracks names: All Tomorrow's Parties
      //
      // Notice how you can pass an exisiting record and how the track list of the album is entirely redifined when assigning an array

      // you can also perform operations on the array, like push(), splice(), element replacement by assignation using record instances of record as POJOs
      console.log("eurfhef")
      album.tracks.push({ name: "There She Goes Again" })
      // -- tracksCollection [
      //   {"pkValue":"optimistic_2","name":"Sunday Morning","album_id":null},
      //   {"pkValue":"optimistic_3","name":"Venus in Furs","album_id":null},
      //   {"pkValue":"optimistic_4","name":"All Tomorrow's Parties","album_id":"optimistic_1"},
      //   {"pkValue":"optimistic_7","name":"There She Goes Again","album_id":"optimistic_1"}
      // ]
      // -- album's tracks names: All Tomorrow's Parties, There She Goes Again

      album.tracks[0] = trackCollection.items[0]
      // -- tracksCollection [
      //   {"pkValue":"optimistic_2","name":"Sunday Morning","album_id":"optimistic_1"},
      //   {"pkValue":"optimistic_3","name":"Venus in Furs","album_id":null},
      //   {"pkValue":"optimistic_4","name":"All Tomorrow's Parties","album_id":null},
      //   {"pkValue":"optimistic_7","name":"There She Goes Again","album_id":"optimistic_1"}
      // ]
      // -- album's tracks names: Sunday Morning, There She Goes Again
    })
  })
})
