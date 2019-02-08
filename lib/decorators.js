"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = require("lodash");
/**
 * Marks a Record member as being an ownAttribute of a Record
 * @param target The record
 * @param key The member to be marked as ownAttribute
 */
function ownAttribute(target, key) {
    var constructor = target.constructor;
    if (!lodash_1.isArray(constructor._ownAttributeNames)) {
        constructor._ownAttributeNames = [];
    }
    constructor._ownAttributeNames.push(key);
}
exports.ownAttribute = ownAttribute;
/**
 * Returns a decorator function that marks a Record class member as being a 'toOneAssociation' association of a Record
 * @param associationDescription The description object provided for the association :
 * *foreignCollection*: the associated Record(s)'s foreignCollection instance
 * *foreignKeyAttribute* the name of the property that contains the associated Record(s)'s primary key(s)
 */
function toOneAssociation(associationDescription) {
    return function (target, key) {
        var constructor = target.constructor;
        if (!lodash_1.isObject(constructor._toOneAssociations)) {
            constructor._toOneAssociations = {};
        }
        constructor._toOneAssociations[key] = associationDescription;
    };
}
exports.toOneAssociation = toOneAssociation;
/**
 * Returns a decorator function that marks a Record class member as being a 'toManyAssociation' association of a Record
 * @param associationDescription The description object provided for the association :
 * *foreignCollection*: the associated Record(s)'s foreignCollection instance
 * *selfReferenceAttribute* the name of the property of the foreign records that may contains this Record(s)'s primary key(s)
 */
function toManyAssociation(associationDescription) {
    return function (target, key) {
        var constructor = target.constructor;
        if (!lodash_1.isObject(constructor._toManyAssociations)) {
            constructor._toManyAssociations = {};
        }
        constructor._toManyAssociations[key] = associationDescription;
    };
}
exports.toManyAssociation = toManyAssociation;
