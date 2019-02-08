"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var mobx_1 = require("mobx");
var Bluebird = require("bluebird");
Promise = Bluebird;
var internals_1 = require("./internals");
/**
 * A Store for records.
 * All Storage related manipulations are done here (local and remote synchronisations, instances in memory, ...)
 */
var Collection = /** @class */ (function () {
    function Collection() {
        /**
         * Holds the _collection's records' instances
         * The map is indexed by the records' primary key values.
         */
        this.records = new Map();
    }
    Object.defineProperty(Collection.prototype, "itemsPrimaryKeys", {
        get: function () {
            // ObservebaleMap.prototype._keys is much faster than keys() and returns directly what we need
            return this.records._keys;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Collection.prototype, "items", {
        /**
         * Get a list of the _collection's record instances
         * @returns An array of Record instances
         */
        get: function () {
            var items = [];
            for (var i = 0; i < this.itemsPrimaryKeys.length; i++) {
                var itemPrimaryKey = this.itemsPrimaryKeys[i];
                items[i] = this.records.get(itemPrimaryKey);
            }
            return items;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Indicates whether or not the _collection contains a record with a given primary key
     * @param primaryKey The primary key whose existence will be checked
     * @returns true if the primary key is present, false otherwise
     */
    Collection.prototype.has = function (primaryKey) {
        return this.records.has(primaryKey);
    };
    /**
     * Get a record instance in the _collection form its primary key
     * @param primaryKey the reocrd's primary key value
     * @return The record instance or undefined if there is no record with the given primary key
     */
    Collection.prototype.get = function (primaryKey) {
        return this.records.get(primaryKey);
    };
    Collection.prototype.wherePropEq = function (propName, propValue) {
        var filteredRecords = [];
        for (var i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            if (item[propName] == propValue) {
                filteredRecords.push(item);
            }
        }
        return filteredRecords;
    };
    /**
     * Get multiple record instances in the _collection form their primary keys
     * @param primaryKeyList the reocrds' primary key values
     */
    Collection.prototype.getMany = function (primaryKeyList) {
        var recordInstances = [];
        for (var i = 0; i < primaryKeyList.length; i++) {
            var primaryKey = primaryKeyList[i];
            recordInstances.push(this.get(primaryKey));
        }
        return recordInstances;
    };
    Object.defineProperty(Collection.prototype, "size", {
        /**
         * Get the size of the collection
         * @returns The number of (all) items in the collection
         */
        get: function () {
            return this.records.size;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Add or replace one record in the collection
     * @param recordProperties A plain object reprsentation of the record's properties
     * @param strict Indicates whether or not the method should throw an exception
     * if one of the provided recordProperties keys is not defined
     * as being a property of the Record subclass associated with the colection
     */
    Collection.prototype.set = function (recordProperties, strict) {
        if (strict === void 0) { strict = true; }
        if (recordProperties instanceof internals_1.Record) {
            return recordProperties;
        }
        var recordClass = this.recordClass;
        var recordInstance = new recordClass(this);
        recordInstance._mergeProperties(recordProperties, strict);
        this.records.set(recordInstance._primaryKeyValue, recordInstance);
        return recordInstance;
    };
    /**
     * Add or replace one record in the collection
     * @param recordInstance The record instance to set in the collection
     */
    Collection.prototype.setRecord = function (recordInstance) {
        this.records.set(recordInstance._primaryKeyValue, recordInstance);
        return recordInstance;
    };
    /**
     * Updates the index of the a record with a primaryKeyValue of oldPk (if found)
     * in the collection's records' map
     * @param oldPk the index to be replaced
     * @param newPk the new value of the index
     */
    Collection.prototype.updateRecordPrimaryKey = function (oldPk, newPk) {
        var record = this.get(oldPk);
        if (record) {
            this.records.set(newPk, this.get(oldPk));
            this.records.delete(oldPk);
        }
    };
    /**
     * Add or replace multiple records in the _collection
     * @param recordPropertiesList An array of plain object reprsentation of the records' properties
     * @param strict Indicates whether or not the method should throw an exception
     * if one of the provided recordProperties keys is not defined
     * as being a property of the Record subclass associated with the colection
     */
    Collection.prototype.setMany = function (recordPropertiesList, strict) {
        if (strict === void 0) { strict = true; }
        var recordInstances = [];
        for (var i = 0; i < recordPropertiesList.length; i++) {
            var recordProperties = recordPropertiesList[i];
            recordInstances.push(this.set(recordProperties, strict));
        }
        return recordInstances;
    };
    /**
     * Delete a record with a given primary key in the _collection
     * @param primaryKey The identifier of the record to delete from the _collection
     */
    Collection.prototype.unset = function (primaryKey) {
        this.records.delete(primaryKey);
        return this;
    };
    /**
     * Delete multipe records in the _collection form their primary keys
     * @param primaryKeyList The identifiers of the records to delete from the _collection
     */
    Collection.prototype.unsetMany = function (primaryKeyList) {
        for (var i = 0; i < primaryKeyList.length; i++) {
            var primaryKey = primaryKeyList[i];
            this.unset(primaryKey);
        }
        return this;
    };
    /**
     * Delete all the records in the _collection
     */
    Collection.prototype.clear = function () {
        this.records.clear();
        return this;
    };
    __decorate([
        mobx_1.observable.shallow
    ], Collection.prototype, "records", void 0);
    __decorate([
        mobx_1.computed
    ], Collection.prototype, "itemsPrimaryKeys", null);
    __decorate([
        mobx_1.computed
    ], Collection.prototype, "items", null);
    __decorate([
        mobx_1.computed
    ], Collection.prototype, "size", null);
    __decorate([
        mobx_1.action.bound
    ], Collection.prototype, "set", null);
    __decorate([
        mobx_1.action.bound
    ], Collection.prototype, "setRecord", null);
    __decorate([
        mobx_1.action.bound
    ], Collection.prototype, "updateRecordPrimaryKey", null);
    __decorate([
        mobx_1.action.bound
    ], Collection.prototype, "setMany", null);
    __decorate([
        mobx_1.action.bound
    ], Collection.prototype, "unset", null);
    __decorate([
        mobx_1.action.bound
    ], Collection.prototype, "unsetMany", null);
    __decorate([
        mobx_1.action.bound
    ], Collection.prototype, "clear", null);
    return Collection;
}());
exports.Collection = Collection;
