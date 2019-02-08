import { isArray, isObject, isEmpty } from "lodash"
import {
  Record,
  toOneAssociationDescription,
  toManyAssociationDescription
} from "./internals"

/**
 * Marks a Record member as being an ownAttribute of a Record
 * @param target The record
 * @param key The member to be marked as ownAttribute
 */
export function ownAttribute(target: Record, key: string) {
  const constructor = target.constructor as any
  if (!isArray(constructor._ownAttributeNames)) {
    constructor._ownAttributeNames = []
  }
  constructor._ownAttributeNames.push(key)
}

/**
 * Returns a decorator function that marks a Record class member as being a 'toOneAssociation' association of a Record
 * @param associationDescription The description object provided for the association :
 * *foreignCollection*: the associated Record(s)'s foreignCollection instance
 * *foreignKeyAttribute* the name of the property that contains the associated Record(s)'s primary key(s)
 */
export function toOneAssociation<T>(
  associationDescription: toOneAssociationDescription<T>
) {
  return (target: Record, key: string) => {
    const constructor = target.constructor as any
    if (!isObject(constructor._toOneAssociations)) {
      constructor._toOneAssociations = {}
    }
    constructor._toOneAssociations[key] = associationDescription
  }
}

/**
 * Returns a decorator function that marks a Record class member as being a 'toManyAssociation' association of a Record
 * @param associationDescription The description object provided for the association :
 * *foreignCollection*: the associated Record(s)'s foreignCollection instance
 * *selfReferenceAttribute* the name of the property of the foreign records that may contains this Record(s)'s primary key(s)
 */
export function toManyAssociation<T>(
  associationDescription: toManyAssociationDescription<T>
) {
  return (target: Record, key: string) => {
    const constructor = target.constructor as any
    if (!isObject(constructor._toManyAssociations)) {
      constructor._toManyAssociations = {}
    }
    constructor._toManyAssociations[key] = associationDescription
  }
}
