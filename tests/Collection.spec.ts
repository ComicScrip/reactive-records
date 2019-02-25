import { each } from "lodash"
import {
  Collection,
  Partial,
  PersistenceService,
  PersistenceStrategy
} from "../src/internals"
import { Album, AlbumCollection, albumCollection, ApiClient } from "./internals"
import { Scope } from "../src/Scope"
import { NetworkOnlyStrategy } from "./persistenceStrategies/NetworkOnlyStrategy"

describe("Collection", () => {
  beforeEach(() => {
    albumCollection.clear()
  })

  describe("#set", () => {
    it("can set a record from an object reprentation", () => {
      expect(albumCollection.size).toBe(0)
      const album = albumCollection.set({
        name: "my album",
        coverUrl: "the link"
      })
      expect(albumCollection.size).toBe(1)
      expect(album._ownAttributes).toMatchSnapshot()
    })

    it("does nothing if an exisiting record instance is passed as argument", () => {
      expect(albumCollection.size).toBe(0)
      const album = albumCollection.set({
        name: "my album",
        coverUrl: "the link"
      })
      albumCollection.set(album, false)
      expect(albumCollection.size).toBe(1)
      expect(album._ownAttributes).toMatchSnapshot()
    })

    it("throws an exception if record props are not valid", () => {
      expect(albumCollection.size).toBe(0)
      expect(() => {
        albumCollection.set({
          name: "my album",
          coverUrl: "the link",
          notADeclaredProp: 42
        } as Partial<Album>)
      }).toThrow()
    })
  })

  describe("#setMany", () => {
    it("can set records from an array of record plain objects", () => {
      expect(albumCollection.size).toBe(0)
      const albums = albumCollection.setMany([
        { name: "my album", coverUrl: "the link" },
        { name: "my second album" }
      ])
      expect(albumCollection.size).toBe(2)
      each(albums, album => expect(album._ownAttributes).toMatchSnapshot())
    })

    it("does not throw when and only when param 'strict' is set to false and undeclared record prop is given", () => {
      expect(albumCollection.size).toBe(0)
      expect(() => {
        albumCollection.setMany(
          [
            { name: "my album", coverUrl: "the link" },
            { name: "my second album", notDelared: "zdyzgf" } as Partial<Album>
          ],
          true
        )
      }).toThrow()

      expect(() => {
        albumCollection.setMany(
          [
            { name: "my album", coverUrl: "the link" },
            { name: "my second album", notDelared: "zdyzgf" } as Partial<Album>
          ],
          false
        )
      }).not.toThrow()
    })
  })

  describe("#itemsPrimaryKeys", () => {
    it("returns a list a the primary keys of the items", () => {
      const albums = albumCollection.setMany([
        { id: 1, name: "my album", coverUrl: "the link" },
        { id: 3, name: "my second album" }
      ])

      expect(albumCollection.itemsPrimaryKeys).toMatchSnapshot()
    })
  })

  describe("#items", () => {
    it("reflects the records present in _collection", () => {
      const albums = albumCollection.setMany([
        { name: "my album", coverUrl: "the link" },
        { name: "my second album" }
      ])

      expect(albumCollection.items[0]._ownAttributes).toMatchSnapshot()
      expect(albumCollection.items[1]._ownAttributes).toMatchSnapshot()
    })
  })

  describe("#has", () => {
    it("returns true if the provided primary key is present in the _collection and false otherwise", () => {
      const album = albumCollection.set({
        name: "my album",
        coverUrl: "the link"
      })
      expect(albumCollection.has(album._primaryKeyValue)).toEqual(true)
      expect(albumCollection.has("notexising")).toEqual(false)
    })
  })

  describe("#get", () => {
    it("can get a record from its primary key", () => {
      const album = albumCollection.set({
        name: "my album",
        coverUrl: "the link"
      })
      expect(albumCollection.get(album._primaryKeyValue)).toEqual(album)
    })
  })

  describe("#getMany", () => {
    it("can get records from an array of primary keys", () => {
      const albums = albumCollection.setMany([
        { name: "my album", coverUrl: "the link" },
        { name: "my second album" }
      ])

      const pks = albums.map(album => album._primaryKeyValue)
      expect(
        albumCollection.getMany(pks).map(a => a._ownAttributes)
      ).toMatchSnapshot()
      expect(
        albumCollection.getMany([pks[1]]).map(a => a._ownAttributes)
      ).toMatchSnapshot()
    })
  })

  describe("#unset", () => {
    it("can delete a record in the _collection from its primary key", () => {
      const album = albumCollection.set({
        name: "my album",
        coverUrl: "the link"
      })
      expect(albumCollection.size).toEqual(1)
      albumCollection.unset(album._primaryKeyValue)
      expect(albumCollection.size).toEqual(0)
    })
  })

  describe("#unsetMany", () => {
    it("can delete records from an array of primary keys", () => {
      const albums = albumCollection.setMany([
        { name: "my album", coverUrl: "the link" },
        { name: "my second album" },
        { name: "my third album" }
      ])

      expect(albumCollection.size).toEqual(3)
      const pks = albums.map(album => album._primaryKeyValue)
      albumCollection.unsetMany([pks[0], pks[1], "not_existing_pk"])
      expect(albumCollection.items[0]._ownAttributes).toMatchSnapshot()
    })
  })

  describe("scopes", () => {
    describe("#getScope", () => {
      it("should return the desired scope if it exists", () => {
        const ac = albumCollection as any
        const s = new Scope(albumCollection, "scope1")
        ac.scopes = new Map([["scope1", s]])
        expect((ac as AlbumCollection).getScope("scope1")).toBe(s)
      })

      it("should return undefined if the scope does not exist on the collection", () => {
        const ac = albumCollection as any
        const s = new Scope(albumCollection, "scope1")
        ac.scopes = new Map([["scope1", s]])
        expect((ac as AlbumCollection).getScope("scope2")).toBe(undefined)
      })
    })

    describe("provideScope", () => {
      it("should return the desired scope if it exists", () => {
        const ac = albumCollection as any
        const s = new Scope(albumCollection, "scope1")
        ac.scopes = new Map([["scope1", s]])
        expect((ac as AlbumCollection).provideScope("scope1")).toBe(s)
      })

      it("should return a new scope if the scope does not exist on the collection", () => {
        const ac = albumCollection as any
        const s = new Scope(albumCollection, "scope1")
        ac.scopes = new Map([["scope1", s]])
        const s2 = (ac as AlbumCollection).provideScope("scope2")
        expect(s2 instanceof Scope).toBe(true)
      })
    })
  })

  describe("persistence methods", () => {
    describe("load", () => {
      it("should call the collection's persistence stategy loadMany method with the right params", async () => {
        const loadAlbums = jest.fn()
        albumCollection.persistenceStrategy.loadMany = loadAlbums
        const defaultScope = albumCollection.provideScope()
        await albumCollection.load()
        expect(loadAlbums).toHaveBeenLastCalledWith({}, defaultScope)

        const customScope = albumCollection.provideScope("scope1")
        await albumCollection.load(customScope.name, { year: 1970 })
        expect(loadAlbums).toHaveBeenLastCalledWith({ year: 1970 }, customScope)
      })
    })

    describe("loadOne", () => {
      it("should call the collection's persistence stategy loadOne method with the right params", async () => {
        const loadAlbum = jest.fn()
        albumCollection.persistenceStrategy.loadOne = loadAlbum
        const defaultScope = albumCollection.provideScope()
        const record = albumCollection.set({ id: 2 })
        await albumCollection.loadOne(record)
        expect(loadAlbum).toHaveBeenLastCalledWith({}, record, defaultScope)

        const customScope = albumCollection.provideScope("scope1")
        await albumCollection.loadOne(record, customScope.name, { year: 1970 })
        expect(loadAlbum).toHaveBeenLastCalledWith(
          { year: 1970 },
          record,
          customScope
        )
      })
    })

    describe("saveOne", () => {
      it("should call the collection's persistence stategy saveOne method with the right params", async () => {
        const saveAlbum = jest.fn()
        albumCollection.persistenceStrategy.saveOne = saveAlbum
        const defaultScope = albumCollection.provideScope()
        const record = albumCollection.set({ id: 2 })
        await albumCollection.saveOne(record)
        expect(saveAlbum).toHaveBeenLastCalledWith({}, record, defaultScope)

        const customScope = albumCollection.provideScope("scope1")
        await albumCollection.saveOne(record, customScope.name)
        expect(saveAlbum).toHaveBeenLastCalledWith({}, record, customScope)
      })
    })

    describe("destroyOne", () => {
      it("should call the collection's persistence stategy destroyOne method with the right params", async () => {
        const destroyAlbum = jest.fn()
        albumCollection.persistenceStrategy.destroyOne = destroyAlbum
        const defaultScope = albumCollection.provideScope()
        const record = albumCollection.set({ id: 2 })
        await albumCollection.destroyOne(record)
        expect(destroyAlbum).toHaveBeenLastCalledWith({}, record, defaultScope)

        const customScope = albumCollection.provideScope("scope1")
        await albumCollection.destroyOne(record, customScope.name)
        expect(destroyAlbum).toHaveBeenLastCalledWith({}, record, customScope)
      })
    })
  })
})
