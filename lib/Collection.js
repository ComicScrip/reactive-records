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
var mobx_utils_1 = require("mobx-utils");
var internals_1 = require("./internals");
var Scope_1 = require("./Scope");
/**
 * A Store for records.
 * All Storage related manipulations are done here (local and remote synchronisations, instances in memory, ...)
 */
var Collection = /** @class */ (function () {
    function Collection() {
        var _this = this;
        /**
         * Holds all the collection's records' instances
         * The map is indexed by the records' primary key values.
         */
        this.records = new Map();
        /**
         * The collection's scopes
         * @type {Map}
         */
        this.scopes = new Map();
        this.persistenceStrategy = null;
        this.getCombinedScopeItems = (function (regex) {
            var scopeNames = _this.scopesNames;
            var items = [];
            for (var i = 0; i < scopeNames.length; i++) {
                var scope = scopeNames[i];
                if (scope.match(regex)) {
                    items = items.concat(_this.scopes.get(scope).items);
                }
            }
            return items;
        }).bind(this);
        /**
         * Takes all scopes mathcing a regex and concat their items
         * @return {RecordType[]}
         * @param regex The regex that will be used against all scopes name
         */
        this.combineScopeItems = mobx_utils_1.createTransformer(this.getCombinedScopeItems);
    }
    Collection.prototype.getPersistenceStrategy = function () {
        if (this.persistenceStrategy === null) {
            throw new Error("Please define a persistence strategy for the collection '" + this.constructor.name + "'");
        }
        return this.persistenceStrategy;
    };
    /**
     * Get a collection scope by name
     * @param {string} name : the name of the scope
     * @return {Scope<RecordType extends Record>}
     */
    Collection.prototype.getScope = function (name) {
        return this.scopes.get(name);
    };
    Object.defineProperty(Collection.prototype, "scopesNames", {
        get: function () {
            return this.scopes._keys;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Get a collection scopes whose name matches a given regex
     * @return {Scope<RecordType extends Record>}
     * @param regex The regex that will be used against all scopes name
     */
    Collection.prototype.getScopesMatching = function (regex) {
        var _this = this;
        return this.scopesNames
            .filter(function (scopeName) { return scopeName.match(regex); })
            .map(function (name) { return _this.scopes.get(name); });
    };
    /**
     * Get an existing scope or create a new one
     * @param {string} name : The name of the scope
     * @param {object} params : the scope's params to be set if specified
     * @return {Scope<RecordType extends Record>}
     */
    Collection.prototype.provideScope = function (name, params) {
        if (name === void 0) { name = "default"; }
        var scope = this.getScope(name);
        if (scope) {
            return scope;
        }
        else {
            scope = new Scope_1.Scope(this, name, params);
            this.setScope(scope);
        }
        if (params) {
            scope.setParams(params);
        }
        return scope;
    };
    /**
     * Set a scope into the collection's scope set
     * @param {Scope<RecordType extends Record>} scope
     */
    Collection.prototype.setScope = function (scope) {
        this.scopes.set(scope.name, scope);
    };
    Collection.prototype.unsetScope = function (scope) {
        this.scopes.delete(scope.name);
    };
    /**
     * Set the collection's persistence strategy
     * @param ps {PersistenceStrategy} : The persistence strategy to set
     * @return {Collection<Record>} : The collection
     */
    Collection.prototype.setPersistenceStratgy = function (ps) {
        this.persistenceStrategy = ps;
        return this;
    };
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
     */
    Collection.prototype.set = function (recordProperties) {
        // TODO: add an option to replace or not
        if (recordProperties instanceof internals_1.Record) {
            return recordProperties;
        }
        var recordClass = this.recordClass;
        var recordInstance = new recordClass(this);
        recordInstance._mergeProperties(recordProperties);
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
        if (oldPk === newPk)
            return;
        var record = this.get(oldPk);
        if (record) {
            this.records.set(newPk, this.get(oldPk));
            this.records.delete(oldPk);
        }
    };
    /**
     * Add or replace multiple records in the _collection
     * @param recordPropertiesList An array of plain object reprsentation of the records' properties
     */
    Collection.prototype.setMany = function (recordPropertiesList) {
        var recordInstances = [];
        for (var i = 0; i < recordPropertiesList.length; i++) {
            var recordProperties = recordPropertiesList[i];
            recordInstances.push(this.set(recordProperties));
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
    /**
     * Loads items into the collection using the collection's persitence strategy
     */
    Collection.prototype.load = function (params, scopeName) {
        if (params === void 0) { params = {}; }
        if (scopeName === void 0) { scopeName = "default"; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getPersistenceStrategy().loadMany(params, this.provideScope(scopeName, params))];
            });
        });
    };
    /**
     * Loads a record into the collection using the collection's persitence strategy
     */
    Collection.prototype.loadOne = function (record, params, scopeName) {
        if (params === void 0) { params = {}; }
        if (scopeName === void 0) { scopeName = "default"; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, r;
            return __generator(this, function (_b) {
                if (!(record instanceof internals_1.Record)) {
                    r = (_a = {}, _a[this.recordClass.primaryKeyName] = record, _a);
                    record = this.set(r);
                }
                return [2 /*return*/, this.getPersistenceStrategy().loadOne(params, record, this.provideScope(scopeName, params))];
            });
        });
    };
    /**
     * Saves one record into the collection using the collection's persitence strategy
     */
    Collection.prototype.saveOne = function (record, params, scopeName) {
        if (params === void 0) { params = {}; }
        if (scopeName === void 0) { scopeName = "default"; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getPersistenceStrategy().saveOne(params, record, this.provideScope(scopeName, params))];
            });
        });
    };
    /**
     * Destroys one record of the collection using the collection's persitence strategy
     */
    Collection.prototype.destroyOne = function (record, params, scopeName) {
        if (params === void 0) { params = {}; }
        if (scopeName === void 0) { scopeName = "default"; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getPersistenceStrategy().destroyOne(params, record, this.provideScope(scopeName, params))];
            });
        });
    };
    /**
     * Unset all scopes and records from the collection
     */
    Collection.prototype.reset = function () {
        this.scopes = new Map();
        this.clear();
    };
    __decorate([
        mobx_1.observable.shallow
    ], Collection.prototype, "records", void 0);
    __decorate([
        mobx_1.observable
    ], Collection.prototype, "scopes", void 0);
    __decorate([
        mobx_1.action.bound
    ], Collection.prototype, "setScope", null);
    __decorate([
        mobx_1.action.bound
    ], Collection.prototype, "unsetScope", null);
    __decorate([
        mobx_1.action.bound
    ], Collection.prototype, "setPersistenceStratgy", null);
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
    __decorate([
        mobx_1.action.bound
    ], Collection.prototype, "load", null);
    __decorate([
        mobx_1.action.bound
    ], Collection.prototype, "loadOne", null);
    __decorate([
        mobx_1.action.bound
    ], Collection.prototype, "saveOne", null);
    __decorate([
        mobx_1.action.bound
    ], Collection.prototype, "destroyOne", null);
    __decorate([
        mobx_1.action.bound
    ], Collection.prototype, "reset", null);
    return Collection;
}());
exports.Collection = Collection;
