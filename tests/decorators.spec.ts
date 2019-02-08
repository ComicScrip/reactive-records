import { baseCollection } from "./internals"
import {
  toOneAssociation,
  ownAttribute,
  Record,
  toManyAssociation
} from "../src/internals"
import { observable } from "mobx"

describe("decorators", () => {
  describe("#ownAttribute", () => {
    it("stores the names of the attributes marked with @ownAttribute in the record's constructor", () => {
      class TestRecord extends Record {
        @observable
        @ownAttribute
        attr1
        @observable
        @ownAttribute
        attr2
        @observable
        attr3
      }
      const constructor = TestRecord as any
      expect(constructor._ownAttributeNames).toMatchInlineSnapshot(`
Array [
  "attr1",
  "attr2",
]
`)
    })
  })

  describe("#toOneAssociation", () => {
    it("stores a proper association description object in the record's constructor", () => {
      class TestRecord extends Record {
        @observable
        @ownAttribute
        association1_id

        @observable
        @toOneAssociation<TestRecord>({
          foreignKeyAttribute: "association1_id",
          foreignCollection: () => baseCollection
        })
        association1

        @observable
        @ownAttribute
        association2_id

        @observable
        @toOneAssociation<TestRecord>({
          foreignKeyAttribute: "association2_id",
          foreignCollection: () => baseCollection
        })
        association2
      }

      const constructor = TestRecord as any

      expect(constructor._toOneAssociations).toMatchInlineSnapshot(`
Object {
  "association1": Object {
    "foreignCollection": [Function],
    "foreignKeyAttribute": "association1_id",
  },
  "association2": Object {
    "foreignCollection": [Function],
    "foreignKeyAttribute": "association2_id",
  },
}
`)
    })

    describe("#toManyAssociation", () => {
      it("stores a proper association description object in the record's constructor", () => {
        class TestRecord extends Record {
          @observable
          @ownAttribute
          association1_id

          @observable
          @toManyAssociation<TestRecord>({
            foreignKeyAttribute: "association1_id",
            foreignCollection: () => baseCollection
          })
          association1

          @observable
          @ownAttribute
          association2_id

          @observable
          @toManyAssociation<TestRecord>({
            foreignKeyAttribute: "association2_id",
            foreignCollection: () => baseCollection
          })
          association2
        }

        const constructor = TestRecord as any

        expect(constructor._toManyAssociations).toMatchInlineSnapshot(`
Object {
  "association1": Object {
    "foreignCollection": [Function],
    "foreignKeyAttribute": "association1_id",
  },
  "association2": Object {
    "foreignCollection": [Function],
    "foreignKeyAttribute": "association2_id",
  },
}
`)
      })
    })
  })
})
