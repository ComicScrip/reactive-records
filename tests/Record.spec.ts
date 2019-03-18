import { startsWith } from "lodash"
import {
  Album,
  AlbumAttributes,
  albumCollection,
  Track,
  bandCollection,
  Band,
  baseCollection,
  BaseRecord,
  trackCollection,
  TrackCollection
} from "./internals"
import { Partial, Collection, Record, ownAttribute } from "../src/index"
import { PrimaryKey } from "../src"
import { observable, reaction } from "mobx"
import { toManyAssociation, toOneAssociation } from "../src/decorators"

describe("Record", () => {
  let album: Album

  beforeEach(() => {
    trackCollection.clear()
    albumCollection.clear()
  })

  describe("constructor", () => {
    it("throws when null or bad _collection is given", () => {
      expect(() => {
        new Album(null)
      }).toThrow()

      expect(() => {
        new Album({} as Collection<Record>)
      }).toThrow()
    })
  })

  describe("pseudo-refelection methods", () => {
    let album: Album = null
    beforeAll(() => {
      album = albumCollection.set({})
    })
    it("# get _ownAttributesNames", () => {
      const baseRecord = new BaseRecord(baseCollection)
      expect(baseRecord._ownAttributesNames).toMatchSnapshot()
      expect(album._ownAttributesNames).toMatchSnapshot()
      const track = new Track(trackCollection)
      expect(track._ownAttributesNames).toMatchSnapshot()
    })

    it("# get _ownAttributes", () => {
      const albumOwnAttributes = {
        id: 1,
        name: "Foxtrot",
        coverUrl: "https://moonunderwaterblog.files.wordpress.com/2016/07/genesis-foxtrot-lp.jpg"
      }
      album.name = albumOwnAttributes.name
      album.id = albumOwnAttributes.id
      album.coverUrl = albumOwnAttributes.coverUrl
      expect(album._ownAttributes).toMatchSnapshot()
    })

    it("# get _toOneAssociationsNames", () => {
      expect(album._toOneAssociationsNames).toMatchInlineSnapshot(`
Array [
  "band",
]
`)
    })

    it("# get _toOneAssociations", () => {
      const baseRecord = new BaseRecord(baseCollection)
      expect(baseRecord._toOneAssociations).toMatchSnapshot()
      expect(album._toOneAssociations).toMatchInlineSnapshot(`
Object {
  "band": Object {
    "foreignCollection": [Function],
    "foreignKeyAttribute": "band_id",
  },
}
`)
    })

    it("# get _propertiesNames", () => {
      expect(album._propertiesNames).toMatchInlineSnapshot(`
Array [
  "id",
  "coverUrl",
  "name",
  "releaseDate",
  "band_id",
  "band",
  "tracks",
]
`)
    })

    it("#_hasProperty", () => {
      expect(album._hasProperty("name")).toBeTruthy()
      expect(album._hasProperty("band")).toBeTruthy()
      expect(album._hasProperty("notAPropOfAlbum")).toBeFalsy()
    })
  })

  describe("#_mergeProperties", () => {
    let album: Album = null
    beforeAll(() => {
      album = albumCollection.set({})
    })
    describe("called with (default) strict = true", () => {
      it("sets given valid properties on the record", () => {
        const albumOwnAttributes = {
          id: 1,
          name: "Foxtrot",
          coverUrl: "https://moonunderwaterblog.files.wordpress.com/2016/07/genesis-foxtrot-lp.jpg"
        }

        album._mergeProperties(albumOwnAttributes)
        expect(album.id).toEqual(albumOwnAttributes.id)
        expect(album.name).toEqual(albumOwnAttributes.name)
        expect(album.coverUrl).toEqual(albumOwnAttributes.coverUrl)
      })

      it("throws an error when the given properties contain a key not declared as a property and strict is left to true", () => {
        const invalidProps = {
          id: 1,
          name: "Foxtrot",
          coverUrl: "https://moonunderwaterblog.files.wordpress.com/2016/07/genesis-foxtrot-lp.jpg",
          notADeclaredProp: 42
        }

        expect(() => {
          album._mergeProperties(invalidProps)
        }).toThrow()
      })

      it("does not throw an error when the given properties contain a key not declared as a property and strict is set to false", () => {
        const invalidProps = {
          id: 1,
          name: "Foxtrot",
          coverUrl: "https://moonunderwaterblog.files.wordpress.com/2016/07/genesis-foxtrot-lp.jpg",
          notADeclaredProp: 42
        }

        expect(() => {
          album._mergeProperties(invalidProps, false)
        }).not.toThrow()
      })
    })
  })

  describe("__configurePrimaryKeyAssignations", () => {
    describe("given a primary key", () => {
      let band = null
      beforeEach(() => {
        band = new Band(bandCollection)._mergeProperties({
          name: "genesis",
          id: 1
        })
      })

      it("stores the identifier in the _realPrimaryKey field", () => {
        expect(band._realPrimaryKey).toMatchInlineSnapshot(`1`)
      })

      it("_primaryKeyValue field is has the right value", () => {
        expect(band._primaryKeyValue).toMatchInlineSnapshot(`1`)
      })
    })

    describe("not given a primary key", () => {
      let band = null
      beforeEach(() => {
        band = new Band(bandCollection)._mergeProperties({
          name: "genesis"
        })
      })

      it("stores null in the _realPrimaryKey field", () => {
        expect(band._realPrimaryKey).toMatchInlineSnapshot(`null`)
      })

      it("_primaryKeyValue stays optimistic", () => {
        expect(startsWith("optimistic_", band._primaryKeyValue))
      })
    })

    describe("given undefined primary key", () => {
      let band = null
      beforeEach(() => {
        band = new Band(bandCollection)._mergeProperties({
          id: undefined
        })
      })

      it("stores null in the _realPrimaryKey field", () => {
        expect(band._realPrimaryKey).toMatchInlineSnapshot(`null`)
      })

      it("_primaryKeyValue stays optimistic", () => {
        expect(startsWith("optimistic_", band._primaryKeyValue))
      })
    })
  })

  describe("#__configureToOneAssociations", () => {
    describe("belongsTo associations", () => {
      it("builds the instance when assigning a plain object", () => {
        const instance = new Album(albumCollection)._mergeProperties({
          band: { name: "genesis" } as Band
        })

        expect(instance.band instanceof Band).toBeTruthy()
        expect(instance.band.name).toMatchInlineSnapshot(`"genesis"`)
      })

      it("works when assigninng a Record instance", () => {
        const bc = bandCollection
        const band = new Band(bandCollection)._mergeProperties({
          name: "genesis"
        }) as Band
        const instance = new Album(albumCollection)._mergeProperties({
          band
        })

        expect(instance.band instanceof Band).toBeTruthy()
        expect(instance.band.name).toMatchInlineSnapshot(`"genesis"`)
      })

      it("works when assigninng a Record instance", () => {
        const band = new Band(bandCollection)._mergeProperties({
          name: "genesis"
        }) as Band
        const instance = new Album(albumCollection)._mergeProperties({
          band
        })

        expect(instance.band instanceof Band).toBeTruthy()
        expect(instance.band.name).toMatchInlineSnapshot(`"genesis"`)
      })

      it("tracks the foreign record's primary key changes to keep the foreignKey attribute up to date", () => {
        const album = albumCollection.set({
          name: "Selling England By The Pound"
        })
        album.band = bandCollection.set({ id: 123, name: "Genesis" })
        album.band.id = 124

        expect(album.band instanceof Band).toBeTruthy()
        expect(album.band.name).toMatchInlineSnapshot(`"Genesis"`)
      })

      it("gives a default foreignKeyAttribute if none was specified", () => {
        class Album2 extends Record {
          @observable
          @ownAttribute
          id: PrimaryKey
          @observable
          @ownAttribute
          name: string
          @observable
          @toOneAssociation({
            foreignCollection: () => bandCollection
          })
          band: Partial<Band>
          @observable
          @ownAttribute
          band_id: PrimaryKey
        }

        class AlbumCollection2 extends Collection<Album2> {
          get recordClass(): typeof Album2 {
            return Album2
          }
        }

        const a = new Album2(new AlbumCollection2())
        a.band = bandCollection.set({ name: "genesis" })
        expect(a.band_id).toEqual(a.band._primaryKeyValue)
      })

      it("throws when 'foreignCollection' param does not return an instance of Collection", () => {
        class Album2 extends Record {
          @observable
          @ownAttribute
          id: PrimaryKey
          @observable
          @ownAttribute
          name: string
          @observable
          @toOneAssociation({
            foreignCollection: () => ({} as Collection<Record>)
          })
          band: Partial<Band>
          @observable
          @ownAttribute
          band_id: PrimaryKey
        }

        class AlbumCollection2 extends Collection<Album2> {
          get recordClass(): typeof Album2 {
            return Album2
          }
        }

        expect(() => {
          const a = new Album2(new AlbumCollection2())
        }).toThrowError(
          "foreign collection not valid, please check the 'foreignCollection' parameter of @toOneAssociation decorator on band attribute"
        )
      })

      it("does not crash when the foreignKeyAttribute is assigned a primary that does not exist in the foreign collection", () => {
        expect(() => {
          const album = albumCollection.set({ name: "test" })
          album.band_id = 999
        }).not.toThrow()
      })

      it("Observers of the association are notified when a record with matching primary key is added or removed from to the foreign collection", () => {
        const album = albumCollection.set({ name: "test", band_id: 1 })
        const sideEffectFunc = jest.fn()
        reaction(() => album.band, band => sideEffectFunc(band))
        bandCollection.set({ id: 2 })
        expect(sideEffectFunc).not.toHaveBeenCalled()
        const band = bandCollection.set({ id: 1 })
        expect(sideEffectFunc).toHaveBeenLastCalledWith(band)
        bandCollection.clear()
        expect(sideEffectFunc).toHaveBeenLastCalledWith(undefined)
      })
    })

    describe("hasOne association", () => {})
  })

  describe("#__configureToManyAssociations", () => {
    describe("hasMany associations", () => {
      it("gives a default foreignKeyAttribute if none was specified", () => {
        class Album extends Record {
          @observable
          @ownAttribute
          id: PrimaryKey
          @observable
          @ownAttribute
          name: string
          @toManyAssociation<Track>({
            foreignCollection: () => trackCollection
          })
          tracks: Array<Track> = []
          @observable
          @ownAttribute
          band_id: PrimaryKey
        }

        class AlbumCollection extends Collection<Album> {
          get recordClass(): typeof Album {
            return Album
          }
        }

        const a = new Album(new AlbumCollection())
        a.tracks = [{ name: "test" }] as Track[]
        expect(a.tracks.length).toBe(1)
      })

      it("throws when 'foreignCollection' param does not return an instance of Collection", () => {
        class Album extends Record {
          @observable
          @ownAttribute
          id: PrimaryKey
          @observable
          @ownAttribute
          name: string
          @observable
          @toManyAssociation<Track>({
            foreignKeyAttribute: "album_id",
            foreignCollection: () => ({} as TrackCollection)
          })
          tracks: Array<Track> = []
        }

        class AlbumCollection2 extends Collection<Album> {
          get recordClass(): typeof Album {
            return Album
          }
        }

        expect(() => {
          const a = new Album(new AlbumCollection2())
        }).toThrowError(
          "foreign collection not valid, please check the 'foreignCollection' parameter of @toManyAssociation decorator on tracks attribute"
        )
      })

      describe("association getter", () => {
        it("association attribute returns the associated records in the foreign colection", () => {
          const album = albumCollection.set({ name: "Foxtrot" })

          const sideEffectFunc = jest.fn()
          reaction(
            () => album.tracks.map(t => t.name),
            trackNames => {
              sideEffectFunc(trackNames)
            }
          )

          const t1 = trackCollection.set({
            id: 11,
            name: "Watcher of the skies",
            duration: 443,
            album_id: album._primaryKeyValue
          })
          const t2 = trackCollection.set({
            id: 22,
            name: "Time tabl",
            duration: 286
          })
          const t3 = trackCollection.set({
            id: 33,
            name: "Musical box",
            duration: 630
          })
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Watcher of the skies"])
          t2.album_id = album._primaryKeyValue
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Watcher of the skies", "Time tabl"])
          trackCollection.unset(11)
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Time tabl"])
          t2.name = t2.name + "e"
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Time table"])
        })
      })

      describe("association setter", () => {
        it("should throw if something else than an array is given to the association property as a value", () => {
          const album = albumCollection.set({ name: "Foxtrot" })
          const sideEffectFunc = jest.fn()
          reaction(
            () => album.tracks.map(t => t.name),
            trackNames => {
              sideEffectFunc(trackNames)
            }
          )
          album.tracks = [{ name: "Musical box" }, { name: "Time table" }] as Track[]
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Musical box", "Time table"])
          const incoherentValues = [null, undefined, {}, {}, "wut?!", 42]
          incoherentValues.forEach(incoherentValue => {
            expect(() => {
              album.tracks = incoherentValue as Track[]
            }).toThrowError('You tried to assign a non array to a "toMany" association')
          })
        })

        it("Sets the foreign records in the foreign collection when assigning an array of POJOS to the association attribute", () => {
          const album = albumCollection.set({ name: "Foxtrot" })
          const sideEffectFunc = jest.fn()
          reaction(
            () => album.tracks.map(t => t.name),
            trackNames => {
              sideEffectFunc(trackNames)
            }
          )
          expect(trackCollection.size).toBe(0)
          expect(album.tracks.length).toBe(0)
          album.tracks = [{ name: "Musical box" }, { name: "Time table" }] as Track[]
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Musical box", "Time table"])
          album.tracks = [
            trackCollection.items[1],
            trackCollection.set({ name: "test" }),
            trackCollection.set({ name: "test2" })
          ] as Track[]
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Time table", "test", "test2"])
          album.tracks = []
          expect(trackCollection.size).toBe(4)
          expect(sideEffectFunc).toHaveBeenLastCalledWith([])
        })

        it("Works when assigning an array of foreign Record instances to the association attribute", () => {
          const tc = trackCollection
          const album = albumCollection.set({ name: "Foxtrot" })
          const sideEffectFunc = jest.fn()
          reaction(
            () => album.tracks.map(t => t.name),
            trackNames => {
              sideEffectFunc(trackNames)
            }
          )
          expect(trackCollection.size).toBe(0)
          expect(album.tracks.length).toBe(0)
          const tracks = trackCollection.setMany([
            { name: "Musical box" },
            { name: "Time table" }
          ] as Track[])
          expect(trackCollection.size).toBe(2)
          album.tracks = [tracks[0]]
          expect(trackCollection.size).toBe(2)
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Musical box"])
          album.tracks = [tracks[1]]
          expect(trackCollection.size).toBe(2)
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Time table"])
        })
      })

      describe("association array operations", () => {
        it("Handles push", () => {
          const album = albumCollection.set({ name: "Foxtrot" })
          const sideEffectFunc = jest.fn()
          reaction(
            () => album.tracks.map(t => t.name),
            trackNames => {
              sideEffectFunc(trackNames)
            }
          )
          expect(trackCollection.size).toBe(0)
          expect(album.tracks.length).toBe(0)
          const tracks = trackCollection.setMany([
            { name: "Musical box" },
            { name: "Time table" }
          ] as Track[])
          expect(trackCollection.size).toBe(2)
          album.tracks = [tracks[0]]
          album.tracks.push({ name: "Watcher of the skies" } as Track)
          expect(trackCollection.size).toBe(3)
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Musical box", "Watcher of the skies"])
          album.tracks.push(tracks[1])
          expect(sideEffectFunc).toHaveBeenLastCalledWith([
            "Musical box",
            "Time table",
            "Watcher of the skies"
          ])
        })

        it("Handles splice", () => {
          const album = albumCollection.set({ name: "Foxtrot" })
          const sideEffectFunc = jest.fn()
          reaction(
            () => album.tracks.map(t => t.name),
            trackNames => {
              sideEffectFunc(trackNames)
            }
          )
          expect(album.tracks.length).toBe(0)
          album.tracks = trackCollection.setMany([
            { name: "Musical box" },
            { name: "Time table" }
          ] as Track[])
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Musical box", "Time table"])
          album.tracks.splice(0, 1)
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Time table"])
          expect(trackCollection.size).toBe(2)
          album.tracks.splice(0, 0, trackCollection.items[0])
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Musical box", "Time table"])
          expect(trackCollection.size).toBe(2)
        })

        it("Handles array element repacement through assignation", () => {
          const album = albumCollection.set({ name: "Foxtrot" })
          const sideEffectFunc = jest.fn()
          reaction(
            () => album.tracks.map(t => t.name),
            trackNames => {
              sideEffectFunc(trackNames)
            }
          )
          expect(album.tracks.length).toBe(0)
          album.tracks = trackCollection.setMany([
            { name: "Musical box" },
            { name: "Time table" }
          ] as Track[])
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Musical box", "Time table"])
          expect(trackCollection.size).toBe(2)
          album.tracks[1] = trackCollection.set({
            name: "Watcher of the skies"
          })
          expect(trackCollection.size).toBe(3)
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Musical box", "Watcher of the skies"])
          album.tracks[1] = null
          expect(trackCollection.size).toBe(3)
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Musical box"])
          album.tracks[0] = trackCollection.items[1]
          expect(sideEffectFunc).toHaveBeenLastCalledWith(["Time table"])
        })
      })

      describe("local record primaryKey tracking in foreign records ", () => {
        it("should not lose hasMany associations when upddting pk", () => {
          const album = albumCollection.set({ name: "album1" })
          album.tracks = [{ name: "t1" }] as Track[]
          album.id = 123
          expect(album.tracks.length).toBe(1)
        })
      })
    })

    describe("hasMany through associations", () => {})
  })

  describe("polyMorphic associations", () => {})

  describe("persistence methods", () => {
    describe("#load", () => {
      it("should pass default params", async () => {
        const collectionPersistenceMethod = jest.fn()
        const album = albumCollection.set({})
        Object.defineProperty(albumCollection, "loadOne", {
          value: collectionPersistenceMethod,
          writable: true
        })
        await album._load()
        expect(collectionPersistenceMethod).toHaveBeenLastCalledWith(album, {}, "default")
      })

      it("should call 'loadOne' method on the record's collection with the right params", async () => {
        const collectionPersistenceMethod = jest.fn()
        const album = albumCollection.set({})
        Object.defineProperty(albumCollection, "loadOne", {
          value: collectionPersistenceMethod,
          writable: true
        })
        await album._load({ id: 123 }, "scope1")
        expect(collectionPersistenceMethod).toHaveBeenLastCalledWith(
          album,
          {
            id: 123
          },
          "scope1"
        )

        await album._load({ id: 123 })
        expect(collectionPersistenceMethod).toHaveBeenLastCalledWith(
          album,
          {
            id: 123
          },
          "default"
        )
      })
    })

    describe("#_save", () => {
      it("should pass default params", async () => {
        const collectionPersistenceMethod = jest.fn()
        const album = albumCollection.set({})
        Object.defineProperty(albumCollection, "saveOne", {
          value: collectionPersistenceMethod,
          writable: true
        })
        await album._save()
        expect(collectionPersistenceMethod).toHaveBeenLastCalledWith(album, {}, "default")
      })

      it("should call 'saveOne' method on the record's collection with the right params", async () => {
        const collectionPersistenceMethod = jest.fn()
        const album = albumCollection.set({})
        Object.defineProperty(albumCollection, "saveOne", {
          value: collectionPersistenceMethod,
          writable: true
        })
        await album._save({ id: 123 }, "scope1")
        expect(collectionPersistenceMethod).toHaveBeenLastCalledWith(
          album,
          {
            id: 123
          },
          "scope1"
        )

        await album._save({ id: 123 })
        expect(collectionPersistenceMethod).toHaveBeenLastCalledWith(
          album,
          {
            id: 123
          },
          "default"
        )
      })
    })

    describe("#destroy", () => {
      it("should pass default params", async () => {
        const collectionPersistenceMethod = jest.fn()
        const album = albumCollection.set({})
        Object.defineProperty(albumCollection, "destroyOne", {
          value: collectionPersistenceMethod,
          writable: true
        })
        await album._destroy()
        expect(collectionPersistenceMethod).toHaveBeenLastCalledWith(album, {}, "default")
      })

      it("should call 'destroyOne' method on the record's collection with the right params", async () => {
        const collectionPersistenceMethod = jest.fn()
        const album = albumCollection.set({})
        Object.defineProperty(albumCollection, "destroyOne", {
          value: collectionPersistenceMethod,
          writable: true
        })
        await album._destroy({ id: 123 }, "scope1")
        expect(collectionPersistenceMethod).toHaveBeenLastCalledWith(
          album,
          {
            id: 123
          },
          "scope1"
        )

        await album._destroy({ id: 123 })
        expect(collectionPersistenceMethod).toHaveBeenLastCalledWith(
          album,
          {
            id: 123
          },
          "default"
        )
      })
    })
  })

  describe("#_populate", () => {
    let rawAlbum = {}

    beforeAll(() => {
      rawAlbum = {
        id: 1,
        name: "Foxtrot",
        tracks: [
          { id: 11, name: "Watcher of the skies", duration: 443 },
          { id: 22, name: "Time table", duration: 286 },
          { name: "Horizons", duration: 101 }
        ],
        band: {
          id: 123,
          name: "Genesis",
          members: [
            {
              id: 1,
              firstName: "Peter",
              lastName: "Gabriel",
              birthDate: "1950-02-13"
            },
            {
              id: 2,
              firstName: "Tony",
              lastName: "Banks",
              birthDate: "1950-03-27"
            },
            {
              id: 3,
              firstName: "Mike",
              lastName: "Rutherford",
              birthDate: "1950-10-02"
            },
            {
              id: 4,
              firstName: "Steve",
              lastName: "Hackett",
              birthDate: "1950-02-12"
            },
            {
              id: 5,
              firstName: "Phil",
              lastName: "Collins",
              birthDate: "1951-01-30"
            }
          ]
        },
        coverUrl: "https://moonunderwaterblog.files.wordpress.com/2016/07/genesis-foxtrot-lp.jpg"
      }
    })

    it("should work with the record ownAttributes", () => {
      const album = albumCollection.set(rawAlbum as Album)
      const graph = {
        name: "",
        label: "unknown",
        coverUrl: "https://moonunderwaterblog.files.wordpress.com/2016/07/genesis-foxtrot-lp.jpg"
      }
      expect(album._populate(graph)).toEqual({
        name: "Foxtrot",
        coverUrl: "https://moonunderwaterblog.files.wordpress.com/2016/07/genesis-foxtrot-lp.jpg",
        label: "unknown"
      })
    })

    it("should work with toOne association", () => {
      const album = albumCollection.set(rawAlbum as Album)
      let graph = {
        name: undefined,
        band: {
          name: undefined
        }
      }
      expect(album._populate(graph)).toEqual({
        name: "Foxtrot",
        band: {
          name: "Genesis"
        }
      })

      graph = {
        name: undefined,
        notdfinedWithDefault: "test",
        band: {
          name: undefined,
          notdefined: {
            notdefined: {}
          }
        }
      } as any
      expect(album._populate(graph)).toEqual({
        name: "Foxtrot",
        notdfinedWithDefault: "test",
        band: {
          name: "Genesis",
          notdefined: {
            notdefined: {}
          }
        }
      })
    })

    it("should work with toMany association", () => {
      const album = albumCollection.set(rawAlbum as Album)
      let graph = {
        name: undefined,
        band: {
          name: undefined,
          members: {
            fullName: "default"
          }
        },
        tracks: {
          id: null
        }
      }
      expect(album._populate(graph)).toEqual({
        name: "Foxtrot",
        band: {
          name: "Genesis",
          members: [
            { fullName: "Peter Gabriel" },
            { fullName: "Tony Banks" },
            { fullName: "Mike Rutherford" },
            { fullName: "Steve Hackett" },
            { fullName: "Phil Collins" }
          ]
        },
        tracks: [{ id: 11 }, { id: 22 }, { id: null }]
      })
    })
  })
})
