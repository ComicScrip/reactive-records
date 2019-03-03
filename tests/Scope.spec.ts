import { Album, albumCollection } from "./internals"
import { Scope } from "../src/Scope"

describe("Scope", () => {
  describe("constructor", () => {
    it("should set default values for name and params", () => {
      const s = new Scope(albumCollection)
      expect(s.name).toEqual("default")
      expect(s.params).toEqual({})
    })

    it("should set name and params values if provided", () => {
      const s = new Scope(albumCollection, "scope1", { status: "active" })
      expect(s.name).toEqual("scope1")
      expect(s.params).toEqual({ status: "active" })
    })
  })

  describe("#addPk", () => {
    it("should contain one element after adding one pk", () => {
      const s = new Scope<Album>(albumCollection)
      const album = albumCollection.set({ id: 123, name: "Foxtrot" })
      expect(s.itemPrimaryKeys.length).toBe(0)
      s.addPk(album._primaryKeyValue)
      expect(s.itemPrimaryKeys.length).toBe(1)
      expect(s.itemPrimaryKeys[0]).toBe(123)
    })

    it("shouldn't add an existing pk", () => {
      const s = new Scope<Album>(albumCollection)
      const album = albumCollection.set({ id: 123, name: "Foxtrot" })
      expect(s.itemPrimaryKeys.length).toBe(0)
      s.addPk(album._primaryKeyValue)
      s.addPk(album._primaryKeyValue)
      expect(s.itemPrimaryKeys.length).toBe(1)
      expect(s.itemPrimaryKeys[0]).toBe(123)
    })

    it("return the scope", () => {
      const s = new Scope<Album>(albumCollection)
      expect(s.addPk(999) === s).toBe(true)
    })
  })

  describe("#replacePk", () => {
    it("should not contain one element after replacing one pk not in the scope", () => {
      const s = new Scope<Album>(albumCollection)
      const album = albumCollection.set({ id: 123, name: "Foxtrot" })
      expect(s.itemPrimaryKeys.length).toBe(0)
      s.replacePk(999, album._primaryKeyValue)
      expect(s.itemPrimaryKeys.length).toBe(0)
    })

    it("should preserve the order in the pk list after replacing one pk in the scope", () => {
      const s = new Scope<Album>(albumCollection)
      s.itemPrimaryKeys = [123, 999, 125]
      expect(s.itemPrimaryKeys.length).toBe(3)
      expect(s.itemPrimaryKeys).toEqual([123, 999, 125])
      s.replacePk(999, 124)
      expect(s.itemPrimaryKeys.length).toBe(3)
      expect(s.itemPrimaryKeys).toEqual([123, 124, 125])
    })
  })

  describe("removePk", () => {
    it("should do nothing if the pk does not exist in the pk set", () => {
      const s = new Scope(albumCollection)
      s.itemPrimaryKeys = [1, 2, 3]
      expect(s.itemPrimaryKeys.length).toBe(3)
      s.removePk(999)
      expect(s.itemPrimaryKeys.length).toBe(3)
    })

    it("should remove the pk if it exists", () => {
      const s = new Scope(albumCollection)
      s.itemPrimaryKeys = [1, 2, 3]
      s.removePk(2)
      expect(s.itemPrimaryKeys).toEqual([1, 3])
    })
  })

  describe("get items", () => {
    it("should return the correct album instances ", () => {
      const s = new Scope<Album>(albumCollection)
      const album = albumCollection.set({ id: 1, name: "Foxtrot" })
      const album2 = albumCollection.set({ id: 2, name: "Musical Box" })
      s.addPk(album._primaryKeyValue)
      s.addPk(album2._primaryKeyValue)
      expect(s.items.length).toBe(2)
      expect(s.items[0].name).toBe("Foxtrot")
      expect(s.items[1].name).toBe("Musical Box")
    })

    it("should only return proper instances when adding wrong pk", () => {
      const s = new Scope<Album>(albumCollection)
      const album = albumCollection.set({ id: 1, name: "Foxtrot" })
      s.addPk(album._primaryKeyValue)
      s.addPk(9999)
      expect(s.items.length).toBe(1)
      expect(s.items[0].name).toBe("Foxtrot")
    })
  })

  describe("setParams", () => {
    it("should return the scope", () => {
      const s = new Scope(albumCollection)
      expect(s.setParams({ status: "active" })).toBe(s)
    })

    it("should set the params", () => {
      const s = new Scope(albumCollection)
      s.setParams({ status: "active" })
      s.setParams({ status: "inactive" })
      expect(s.params).toEqual({ status: "inactive" })
    })
  })

  describe("load", () => {
    it("should call the scope's collection load method passing the right parameters", async () => {
      Object.defineProperty(albumCollection, "load", {
        value: jest.fn(),
        writable: true
      })
      const s = new Scope(albumCollection)
      await s.load()
      expect(albumCollection.load).toHaveBeenLastCalledWith(s.params, s.name)
      const customParams = { status: "active" }
      await s.load(customParams)
      expect(albumCollection.load).toHaveBeenLastCalledWith(customParams, s.name)
    })
  })
})
