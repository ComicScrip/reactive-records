import { Record, toOneAssociationDescription, toManyAssociationDescription } from "./internals"
/**
 * Marks a Record member as being an ownAttribute of a Record
 * @param target The record
 * @param key The member to be marked as ownAttribute
 */
export declare function ownAttribute(target: Record, key: string): void
/**
 * Returns a decorator function that marks a Record class member as being a 'toOneAssociation' association of a Record
 * @param associationDescription The description object provided for the association :
 * *foreignCollection*: the associated Record(s)'s foreignCollection instance
 * *foreignKeyAttribute* the name of the property that contains the associated Record(s)'s primary key(s)
 */
export declare function toOneAssociation<T>(
  associationDescription: toOneAssociationDescription<T>
): (target: Record, key: string) => void
/**
 * Returns a decorator function that marks a Record class member as being a 'toManyAssociation' association of a Record
 * @param associationDescription The description object provided for the association :
 * *foreignCollection*: the associated Record(s)'s foreignCollection instance
 * *selfReferenceAttribute* the name of the property of the foreign records that may contains this Record(s)'s primary key(s)
 */
export declare function toManyAssociation<T>(
  associationDescription: toManyAssociationDescription<T>
): (target: Record, key: string) => void
