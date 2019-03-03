"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mobx_1 = require("mobx");
var lodash_1 = require("lodash");
var internals_1 = require("./internals");
var Record = /** @class */ (function () {
    /**
     * Instanciate a new Record
     * @param collection The foreignCollection instance holding the record
     */
    function Record(collection) {
        /**
         * A uniquely generated identifier for the record.
         * Used for exemple when creating a new record locally that's not saved on a backend yet.
         */
        this._optimisticPrimaryKey = lodash_1.uniqueId("optimistic_");
        /**
         * Holds the real identifier of the record
         * Usually, it's the identifier fetched from the application's backend
         */
        this._realPrimaryKey = null;
        /**
         * Either false or the persistence service currently used to fetch the record
         * You can use this for exemple to differentiate data loaded form local app storage or a remote API
         */
        this._loadingFrom = false;
        /**
         * Either false or the persistence service lastly used to fetch the record
         * You can use this for exemple to differentiate data loaded form local app storage or a remote API
         */
        this._lastLoadedFrom = false;
        /**
         * Either null or the time when the record was lastely loaded
         * You can use this for exemple to decide if a record can be returned from cache when you have to (re)load it
         */
        this._lastLoadedAt = null;
        /**
         * The store holding the record's instance in its 'records' field
         */
        this._collection = null;
        if (!(collection instanceof internals_1.Collection)) {
            throw new Error("You must give a valid collection to create a Record");
        }
        this._collection = collection;
        collection.setRecord(this);
        this.__configurePrimaryKeyAssignations();
        this.__configureToOneAssociations();
        this.__configureToManyAssociations();
    }
    Object.defineProperty(Record.prototype, "_primaryKeyValue", {
        /**
         * Get the identifier of the record
         */
        get: function () {
            return this._realPrimaryKey || this._optimisticPrimaryKey;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Sets up automatic association instance building when assigning a value to
     * a member decorated with @toOneAssociation
     */
    Record.prototype.__configureToOneAssociations = function () {
        var _this = this;
        var _loop_1 = function (i) {
            var associationName = this_1._toOneAssociationsNames[i];
            var associationDesc = this_1._toOneAssociations[associationName];
            var foreignCollection = associationDesc.foreignCollection();
            if (!(foreignCollection instanceof internals_1.Collection)) {
                throw new Error("foreign collection not valid, please check the 'foreignCollection' parameter of @toOneAssociation decorator on " + associationName + " attribute");
            }
            var foreignKey = associationDesc.foreignKeyAttribute;
            if (lodash_1.isEmpty(foreignKey)) {
                // give it a default name if none was specified
                foreignKey = associationName + "_" + foreignCollection.recordClass.primaryKeyName;
            }
            var foreignPkTrakingDisposer = function () { };
            var trackForeignRecordPk = function () {
                // the purpose of this function is to keep
                // this record's foreign key attribute up to date when
                // the foreign record's pk changes
                var foreignRecord = foreignCollection.get(_this[foreignKey]);
                if (foreignRecord) {
                    var lastpk_1 = foreignRecord._primaryKeyValue;
                    foreignPkTrakingDisposer();
                    foreignPkTrakingDisposer = mobx_1.reaction(function () { return foreignRecord._primaryKeyValue; }, function (pk) {
                        // force the foreign collection to update itself
                        // if we don't do this, 'this[foreignKey] = pk' below
                        // might trigger reactions of oberservers of the association attribute
                        // and the oberservers might get an undefined value
                        foreignCollection.updateRecordPrimaryKey(lastpk_1, pk);
                        _this[foreignKey] = pk;
                    });
                }
            };
            Object.defineProperty(this_1, associationName, {
                get: function () {
                    // delegate the retrival of the association attribute's value to the foreign collection
                    // this way, the associated record will always be lazy loaded
                    return foreignCollection.get(this[foreignKey]);
                },
                set: function (newValue) {
                    if (lodash_1.isObject(newValue) && !(newValue instanceof Record)) {
                        // when doing "myRecord.assoc = {...}"
                        // make a Record instance out of the POJO
                        newValue = foreignCollection.set(newValue);
                    }
                    this[foreignKey] = newValue._primaryKeyValue;
                    trackForeignRecordPk();
                }
            });
            // if the association is changed by assigning a new value to the foreign key attribute
            // make sure we track the new associated record's primary key changes
            mobx_1.reaction(function () { return _this[foreignKey]; }, function () {
                trackForeignRecordPk();
            });
        };
        var this_1 = this;
        for (var i = 0; i < this._toOneAssociationsNames.length; i++) {
            _loop_1(i);
        }
    };
    /**
     * Sets up automatic association instance building when assigning a value to
     * a member decorated with @toOneAssociation
     */
    Record.prototype.__configureToManyAssociations = function () {
        var _this = this;
        var _loop_2 = function (i) {
            var associationName = this_2._toManyAssociationsNames[i];
            var associationDesc = this_2._toManyAssociations[associationName];
            var foreignCollection = associationDesc.foreignCollection();
            if (!(foreignCollection instanceof internals_1.Collection)) {
                throw new Error("foreign collection not valid, please check the 'foreignCollection' parameter of @toManyAssociation decorator on " + associationName + " attribute");
            }
            var thisClassName = this_2.constructor.name.toLowerCase();
            var foreignKey = associationDesc.foreignKeyAttribute;
            if (lodash_1.isEmpty(foreignKey)) {
                // give it a default name if none was specified
                foreignKey = thisClassName + "_" + this_2._collection.recordClass.primaryKeyName;
            }
            var trackForeignRecordPk = function () {
                // the purpose of this function is to keep
                // the foreign record's foreign key up to date with this record's pk
                var pkName = _this._collection.recordClass.primaryKeyName;
                var oldPkValue = _this._primaryKeyValue;
                mobx_1.intercept(_this, pkName, function (change) {
                    var existingAssociatedRecords = foreignCollection.wherePropEq(foreignKey, oldPkValue);
                    existingAssociatedRecords.forEach(function (r) {
                        r[foreignKey] = change.newValue;
                    });
                    oldPkValue = change.newValue;
                    return change;
                });
            };
            var interceptArrayMutations = function (change) {
                // when doing myRecord.assoc.push(...) or myRecord.assoc[0] = ...
                var existingAssociatedRecords = foreignCollection.wherePropEq(foreignKey, _this._primaryKeyValue);
                if (change.removedCount > 0) {
                    var existingAssociatedRecords_1 = foreignCollection.wherePropEq(foreignKey, _this._primaryKeyValue);
                    for (var j = change.index; j < change.removedCount; j++) {
                        var removed = existingAssociatedRecords_1[j];
                        removed[foreignKey] = null;
                    }
                }
                if (!lodash_1.isEmpty(change.added)) {
                    for (var j = 0; j < change.added.length; j++) {
                        var pushed = change.added[j];
                        pushed[foreignKey] = _this._primaryKeyValue;
                        change.added[j] = foreignCollection.set(pushed);
                    }
                }
                if (change.type === "update") {
                    var existingAssociatedRecords_2 = foreignCollection.wherePropEq(foreignKey, _this._primaryKeyValue);
                    existingAssociatedRecords_2[change.index][foreignKey] = null;
                    if (change.newValue) {
                        change.newValue[foreignKey] = _this._primaryKeyValue;
                        change.newValue = foreignCollection.set(change.newValue);
                    }
                }
                return change;
            };
            Object.defineProperty(this_2, associationName, {
                get: function () {
                    // delegate the retrival of the association attribute's value to the foreign collection
                    // this way, the associated record will always be lazy loaded
                    // the returned value needs to be an observable array in order to manage pushs, etc
                    var a = mobx_1.observable.array(foreignCollection.wherePropEq(foreignKey, this._primaryKeyValue));
                    a.intercept(interceptArrayMutations);
                    return a;
                },
                set: function (newValues) {
                    // when doing "myRecord.assoc = [{...}, {...}]"
                    if (lodash_1.isArray(newValues)) {
                        var recordsToSet = newValues;
                        var existingAssociatedRecords = foreignCollection.wherePropEq(foreignKey, this._primaryKeyValue);
                        var newValuesPkBoolMap = {};
                        for (var j = 0; j < newValues.length; j++) {
                            var record = newValues[j];
                            var pk = record instanceof Record
                                ? record._primaryKeyValue
                                : newValues[j][foreignCollection.recordClass.primaryKeyName];
                            newValuesPkBoolMap[pk] = true;
                            recordsToSet[j][foreignKey] = this._primaryKeyValue;
                        }
                        // we have to nullify foreign keys for exisiting associated records whose pk does not appear in new values
                        for (var j = 0; j < existingAssociatedRecords.length; j++) {
                            if (!newValuesPkBoolMap[existingAssociatedRecords[j]._primaryKeyValue]) {
                                existingAssociatedRecords[j][foreignKey] = null;
                            }
                        }
                        foreignCollection.setMany(recordsToSet, false);
                    }
                    else {
                        throw new Error('You tried to assign a non array to a "toMany" association');
                    }
                    trackForeignRecordPk();
                }
            });
        };
        var this_2 = this;
        for (var i = 0; i < this._toManyAssociationsNames.length; i++) {
            _loop_2(i);
        }
    };
    Record.prototype.__configurePrimaryKeyAssignations = function () {
        var _this = this;
        var constructor = this.constructor;
        mobx_1.intercept(this, constructor.primaryKeyName, function (change) {
            var oldPk = _this._primaryKeyValue;
            _this._realPrimaryKey = change.newValue || null;
            _this._collection.updateRecordPrimaryKey(oldPk, _this._primaryKeyValue);
            return change;
        });
    };
    Object.defineProperty(Record.prototype, "_ownAttributesNames", {
        /**
         * Get a record's _ownAttributes names
         * @returns An array containing all members' name decorated with @ownAttribute
         */
        get: function () {
            var c = this.constructor;
            return c._ownAttributeNames;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Record.prototype, "_ownAttributes", {
        /**
         * Get a record's _ownAttributes' keys and values
         * @returns An plain object representation of the record's _ownAttributes
         */
        get: function () {
            var ownAttributesObject = {};
            for (var i = 0; i < this._ownAttributesNames.length; i++) {
                var ownAttributesName = this._ownAttributesNames[i];
                ownAttributesObject[ownAttributesName] = this[ownAttributesName];
            }
            return ownAttributesObject;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Record.prototype, "_toOneAssociationsNames", {
        /**
         * Get a list of the record's 'toOne' associations names
         * @returns An array containing all members' name decorated with @toOneAssociation decorator
         */
        get: function () {
            return Object.keys(this._toOneAssociations);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Record.prototype, "_toOneAssociations", {
        /**
         * Get a map of description objects of the record's members decorated with @toOneAssociation
         * @returns An object indexed by 'toOne' association names, values of the object are association descriptions
         */
        get: function () {
            var c = this.constructor;
            return c._toOneAssociations || {};
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Record.prototype, "_toManyAssociations", {
        /**
         * Get a map of description objects of the record's members decorated with @toOneAssociation
         * @returns An object indexed by 'toOne' association names, values of the object are association descriptions
         */
        get: function () {
            var c = this.constructor;
            return c._toManyAssociations || {};
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Record.prototype, "_toManyAssociationsNames", {
        /**
         * Get a list of the record's 'toMany' associations names
         * @returns An array containing all members' name decorated with @toManyAssociation decorator
         */
        get: function () {
            return Object.keys(this._toManyAssociations);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Record.prototype, "_propertiesNames", {
        /**
         * Get a list of all the properties names of a record (including its _ownAttributes, its _toOneAssociations and its _toManyAssociations)
         * @returns an array of all record's members decorated with @ownAttributes or @toOneAssociation or @toManyAssociation decorators
         */
        get: function () {
            return this._ownAttributesNames.concat(this._toOneAssociationsNames, this._toManyAssociationsNames);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Tells whether a given property name has been declared as a property of the record
     * @param propNameToCheck The property name whose existence should be checked in the record
     * @returns true if the record has a declared propery named like 'propNameToCheck', false otherwise
     */
    Record.prototype._hasProperty = function (propNameToCheck) {
        for (var i = 0; i < this._propertiesNames.length; i++) {
            var propName = this._propertiesNames[i];
            if (propName === propNameToCheck) {
                return true;
            }
        }
        return false;
    };
    /**
     * Safely merges given properties with the record's declared properties
     * Only declared _ownAttributes or _toOneAssociations prop keys will be merged.
     * If a key in given properties parameter has not been delared as a property within the record,
     * an error will be thrown unless the 'strict' param is set to false
     * @param properties
     * @param strict Indicates if an an error should be thrown when a key that is not supposed to exist in the 'properties' param
     */
    Record.prototype._mergeProperties = function (properties, strict) {
        if (strict === void 0) { strict = true; }
        for (var i = 0, propKeys = lodash_1.keys(properties); i < propKeys.length; i++) {
            var propKey = propKeys[i];
            var propValue = properties[propKey];
            if (this._hasProperty(propKey)) {
                this[propKey] = propValue;
            }
            else if (strict) {
                throw new Error("Tried to assign something not defined in model '" + this.constructor.name + " associations or ownAttributes' : '" + propKey + "'");
            }
        }
        return this;
    };
    /**
     * Calls the record's collection 'loadOne' method with provided params
     * @param {object} params : params passed to the persistence service
     * @param {string} scopeName : The name of the scope the item should be loaded into
     */
    Record.prototype._load = function (params, scopeName) {
        if (scopeName === void 0) { scopeName = "default"; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._collection.loadOne(this, params, scopeName)];
            });
        });
    };
    /**
     * Calls the record's collection 'saveOne' method with provided params
     * @param {object} params : params passed to the persistence service
     * @param {string} scopeName : The name of the scope the item should be saved into
     */
    Record.prototype._save = function (params, scopeName) {
        if (scopeName === void 0) { scopeName = "default"; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._collection.saveOne(this, params, scopeName)];
            });
        });
    };
    /**
     * Calls the record's collection 'saveOne' method with provided params
     * @param {object} params : params passed to the persistence service
     * @param {string} scopeName : The name of the scope the item should deleted from
     */
    Record.prototype._destroy = function (params, scopeName) {
        if (scopeName === void 0) { scopeName = "default"; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._collection.destroyOne(this, params, scopeName)];
            });
        });
    };
    /**
     * Tries to populate the graph object in paramters with the record's properties
     * @returns The populated given graph object with the records's Poperties and eventually its associated records properties
     */
    Record.prototype._populate = function (graph) {
        var ks = lodash_1.keys(graph);
        var toOneAssociationNames = this._toOneAssociationsNames;
        var toManyAssociationNames = this._toManyAssociationsNames;
        for (var i = 0; i < ks.length; i++) {
            var k = ks[i];
            if (lodash_1.isObject(graph[k])) {
                if (lodash_1.includes(toOneAssociationNames, k)) {
                    this[k]._populate(graph[k]);
                }
                else if (lodash_1.includes(toManyAssociationNames, k)) {
                    var associatedDesc = graph[k];
                    graph[k] = [];
                    var numberOfAssociatedRecords = this[k].length;
                    for (var j = 0; j < numberOfAssociatedRecords; j++) {
                        var associatedRecord = this[k][j];
                        graph[k][j] = lodash_1.clone(associatedDesc);
                        associatedRecord._populate(graph[k][j]);
                    }
                }
            }
            else if (this[k] !== undefined) {
                graph[k] = this[k];
            }
        }
        return graph;
    };
    /**
     * The field that is used to uniquely identify a record among the other records of the same type
     */
    Record.primaryKeyName = "id";
    __decorate([
        mobx_1.observable
    ], Record.prototype, "_optimisticPrimaryKey", void 0);
    __decorate([
        mobx_1.observable
    ], Record.prototype, "_realPrimaryKey", void 0);
    __decorate([
        mobx_1.computed
    ], Record.prototype, "_primaryKeyValue", null);
    __decorate([
        mobx_1.observable
    ], Record.prototype, "_loadingFrom", void 0);
    __decorate([
        mobx_1.observable
    ], Record.prototype, "_lastLoadedFrom", void 0);
    __decorate([
        mobx_1.observable
    ], Record.prototype, "_lastLoadedAt", void 0);
    __decorate([
        mobx_1.computed
    ], Record.prototype, "_ownAttributes", null);
    __decorate([
        mobx_1.action.bound
    ], Record.prototype, "_mergeProperties", null);
    __decorate([
        mobx_1.action.bound
    ], Record.prototype, "_load", null);
    __decorate([
        mobx_1.action.bound
    ], Record.prototype, "_save", null);
    __decorate([
        mobx_1.action.bound
    ], Record.prototype, "_destroy", null);
    return Record;
}());
exports.Record = Record;
