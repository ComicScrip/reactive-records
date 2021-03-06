import { each } from "lodash"
import { Collection, Record } from "../src/internals"
import { AlbumCollection, albumCollection } from "./internals"
import { Scope } from "../src/Scope"
import { NetworkOnlyStrategy } from "./persistenceStrategies/NetworkOnlyStrategy"
import { computed, reaction } from "mobx"

describe("Collection", () => {
  beforeEach(() => {
    albumCollection.clear()
  })

  describe("merge", () => {
    it("can merge a record from an object reprentation", () => {
      expect(albumCollection.size).toBe(0)
      albumCollection.merge({
        id: 1,
        name: "my album",
        coverUrl: "the link"
      })
      const newalbum = albumCollection.merge({
        id: 1,
        name: "my new album"
      })
      expect(albumCollection.size).toBe(1)
      expect(newalbum.coverUrl).toEqual("the link")
      expect(newalbum.name).toEqual("my new album")
    })

    it("can merge a record from a record instance", () => {
      expect(albumCollection.size).toBe(0)
      const album = albumCollection.set({
        id: 1,
        name: "my album",
        coverUrl: "the link"
      })
      const newalbum = albumCollection.merge(album)
      expect(albumCollection.size).toBe(1)
      expect(newalbum.coverUrl).toEqual("the link")
      expect(newalbum.name).toEqual("my album")
    })
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
      albumCollection.set(album)
      expect(albumCollection.size).toBe(1)
      expect(album._ownAttributes).toMatchSnapshot()
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
  })

  describe("#mergeMany", () => {
    it("can set records from an array of record plain objects", () => {
      expect(albumCollection.size).toBe(0)
      const albums = albumCollection.mergeMany([
        { id: 1, name: "my album", coverUrl: "the link" },
        { id: 2, name: "my second album" }
      ])

      const newAlbums = albumCollection.mergeMany([
        { id: 1, name: "my new album", releaseDate: new Date() },
        { id: 3, name: "my third album" }
      ])

      expect(albumCollection.size).toEqual(3)
      expect(albumCollection.get(1).name).toEqual("my new album")
      expect(albumCollection.get(1).coverUrl).toEqual("the link")
      expect(albumCollection.get(2).name).toEqual("my second album")
      expect(albumCollection.get(3).name).toEqual("my third album")
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
      expect(albumCollection.getMany(pks).map(a => a._ownAttributes)).toMatchSnapshot()
      expect(albumCollection.getMany([pks[1]]).map(a => a._ownAttributes)).toMatchSnapshot()
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
    describe("unsetScope", () => {
      it("should remove the scope from the collection's scopes map", () => {
        new Scope(albumCollection, "s1")
        const s2 = new Scope(albumCollection, "s2")
        new Scope(albumCollection, "s3")
        expect(albumCollection.scopesNames.length).toEqual(3)
        albumCollection.unsetScope(s2)
        expect(albumCollection.scopesNames.length).toEqual(2)
      })
    })

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

    describe("#getScopesMatching", () => {
      it("should return scopes mathing regex", () => {
        const ac = albumCollection as any
        const s = new Scope(albumCollection, "myScreenPage1")
        const s2 = new Scope(albumCollection, "myScreenPage2")
        const s3 = new Scope(albumCollection, "myOtherScreenPage1")
        ac.scopes = new Map([
          ["myScreenPage1", s],
          ["myScreenPage2", s2],
          ["myOtherScreenPage1", s3]
        ])
        expect((ac as AlbumCollection).getScopesMatching(/myScreen.*/).map(s => s.name)).toEqual([
          "myScreenPage1",
          "myScreenPage2"
        ])
      })

      it("should react when scope items are updated", () => {
        const a1 = albumCollection.set({ id: 1 })
        const a2 = albumCollection.set({ id: 2 })
        const a3 = albumCollection.set({ id: 3 })
        const s1 = albumCollection.provideScope("s1")

        class MyStore {
          @computed
          get derived() {
            let items = []
            albumCollection.getScopesMatching(/s/).forEach(scope => {
              scope.items.forEach(item => {
                items.push(item)
              })
            })

            return items
          }
        }
        const store = new MyStore()
        const onChange = jest.fn()
        reaction(
          () => store.derived,
          items => {
            onChange(items)
          }
        )

        s1.itemPrimaryKeys = [1, 2]
        expect(onChange).toHaveBeenCalledWith([a1, a2])
        s1.itemPrimaryKeys = [1, 2, 3]
        expect(onChange).toHaveBeenCalledWith([a1, a2, a3])
      })
    })

    describe("#combineScopeItems", () => {
      it("should return scopes mathing regex", () => {
        const ac = albumCollection as any
        const reactionCallBack = jest.fn()
        reaction(
          () =>
            (ac as AlbumCollection)
              .combineScopeItems(/myScreen.*/)
              .map(i => i.name)
              .join(", "),
          reactionCallBack
        )
        const r1 = albumCollection.set({ name: "album1" })
        const r2 = albumCollection.set({ name: "album2" })
        const r3 = albumCollection.set({ name: "album3" })

        const s = new Scope(albumCollection, "myScreenPage1")
        const s2 = new Scope(albumCollection, "myScreenPage2")
        const s3 = new Scope(albumCollection, "myOtherScreenPage1")
        s.addPk(r1._primaryKeyValue)
        s2.addPk(r2._primaryKeyValue)
        s3.addPk(r3._primaryKeyValue)
        ac.scopes = new Map([["myScreenPage1", s], ["myOtherScreenPage1", s3]])
        expect(reactionCallBack).toHaveBeenLastCalledWith("album1", expect.anything())
        ac.scopes.set("myScreenPage2", s2)
        expect(reactionCallBack).toHaveBeenLastCalledWith("album1, album2", expect.anything())
        s2.addPk(r3._primaryKeyValue)
        expect(reactionCallBack).toHaveBeenLastCalledWith(
          "album1, album2, album3",
          expect.anything()
        )
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

      it("should pass scope parameters if provided", () => {
        const ac = albumCollection as any
        const s = new Scope(albumCollection, "scope1")
        ac.scopes = new Map([["scope1", s]])
        const params = { band_id: 2 }
        const s2 = (ac as AlbumCollection).provideScope("scope2", params)
        expect(s2 instanceof Scope).toBe(true)
        expect(s2.params).toBe(params)
      })
    })
  })

  describe("persistence methods", () => {
    describe("setPersistenceStrategy", () => {
      it("should set the collection persistence strategy with provided param", () => {
        let ac = new AlbumCollection()
        const ps = new NetworkOnlyStrategy()
        ac.setPersistenceStratgy(ps)
        expect(ac.getPersistenceStrategy()).toBe(ps)
      })

      it("should return the collection", () => {
        let ac = new AlbumCollection()
        const ps = new NetworkOnlyStrategy()
        ac.setPersistenceStratgy(ps)
        expect(ac.setPersistenceStratgy(ps)).toBe(ac)
      })
    })

    describe("getPersistenceStrategy", () => {
      it("should throw if no persistence Stragegy has been defined", () => {
        let ac = new AlbumCollection()
        ac.persistenceStrategy = null
        expect(() => {
          ac.getPersistenceStrategy()
        }).toThrowError("Please define a persistence strategy for the collection 'AlbumCollection'")
      })
    })

    describe("load", () => {
      it("should call the collection's persistence stategy loadMany method with the right params", async () => {
        const loadAlbums = jest.fn()
        albumCollection.persistenceStrategy.loadMany = loadAlbums
        const defaultScope = albumCollection.provideScope()
        await albumCollection.load()
        expect(loadAlbums).toHaveBeenLastCalledWith({}, defaultScope)

        const customScope = albumCollection.provideScope("scope1")
        await albumCollection.load({ year: 1970 }, customScope.name)
        expect(loadAlbums).toHaveBeenLastCalledWith({ year: 1970 }, customScope)
      })
    })

    describe("loadOne", () => {
      it("instanciate a record if a pk is provided", async () => {
        const loadAlbum = jest.fn()
        albumCollection.persistenceStrategy.loadOne = loadAlbum
        const defaultScope = albumCollection.provideScope()
        await albumCollection.loadOne(2)
        expect(loadAlbum).toHaveBeenLastCalledWith({}, expect.any(Record), defaultScope)
        expect(loadAlbum.mock.calls[0][1]._primaryKeyValue).toBe(2)
      })

      it("should call the collection's persistence stategy loadOne method with the right params", async () => {
        const loadAlbum = jest.fn()
        albumCollection.persistenceStrategy.loadOne = loadAlbum
        const defaultScope = albumCollection.provideScope()
        const record = albumCollection.set({ id: 2 })
        await albumCollection.loadOne(record)
        expect(loadAlbum).toHaveBeenLastCalledWith({}, record, defaultScope)

        const customScope = albumCollection.provideScope("scope1")
        await albumCollection.loadOne(record, { year: 1970 }, customScope.name)
        expect(loadAlbum).toHaveBeenLastCalledWith({ year: 1970 }, record, customScope)
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
        await albumCollection.saveOne(record, {}, customScope.name)
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
        await albumCollection.destroyOne(record, {}, customScope.name)
        expect(destroyAlbum).toHaveBeenLastCalledWith({}, record, customScope)
      })
    })

    describe("reset", () => {
      it("should clear all records and scopes", () => {
        albumCollection.provideScope("s1")
        albumCollection.set({ id: 1 })

        albumCollection.reset()
        expect(albumCollection.scopesNames.length).toEqual(0)
        expect(albumCollection.items.length).toEqual(0)
      })
    })
  })
})
