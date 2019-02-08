import { each } from "lodash"
import { Collection, Partial } from "../src/internals"
import { Album, albumCollection } from "./internals"

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
})
