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
/**
 * A subset of a collection
 */
var Scope = /** @class */ (function () {
    function Scope(collection, name, params) {
        if (name === void 0) { name = "default"; }
        if (params === void 0) { params = {}; }
        /**
         * Holds an ordered list of records primary keys
         */
        this.itemPrimaryKeys = [];
        /**
         * Either false or the persistence service currently used to fetch the items
         * You can use this for exemple to differentiate data loaded form local app storage or a remote API
         */
        this.loadingFrom = false;
        /**
         * Either false or the persistence service lastly used to fetch the items
         * You can use this for exemple to differentiate data loaded form local app storage or a remote API
         */
        this.lastLoadedFrom = false;
        /**
         * Either null or the time when the scope was lastely loaded
         * You can use this for exemple to decide if a scope can be returned from cache when you have to (re)load it
         */
        this.lastLoadedAt = null;
        this.params = params;
        this.name = name;
        this.collection = collection;
    }
    /**
     * Sets the scope's paramaters
     * @param {object} params
     * @return {this<RecordType extends Record>}
     */
    Scope.prototype.setParams = function (params) {
        this.params = params;
        return this;
    };
    /**
     * Load items for this scope into the scope's collection
     * @param {object} params
     * @return {Promise<any>}
     */
    Scope.prototype.load = function (params) {
        return this.collection.load(params ? params : this.params, this.name);
    };
    /**
     * returns true if the scope contains the pk
     */
    Scope.prototype.hasPk = function (pk) {
        return this.itemPrimaryKeys.findIndex(function (p) { return p == pk; }) !== -1;
    };
    /**
     * adds primary key in the scope's pk list, if the latter is not already there
     */
    Scope.prototype.addPk = function (pk) {
        if (!this.hasPk(pk)) {
            this.itemPrimaryKeys.push(pk);
        }
        return this;
    };
    /**
     * replace primary key in the scope's pk list by another one
     */
    Scope.prototype.replacePk = function (oldpk, newPk) {
        var pkIndex = this.itemPrimaryKeys.findIndex(function (p) { return p == oldpk; });
        if (pkIndex !== -1) {
            this.itemPrimaryKeys[pkIndex] = newPk;
        }
        return this;
    };
    /**
     * Removes a pk form the set
     * @param {PrimaryKey} pk
     * @return {Scope<RecordType extends Record>}
     */
    Scope.prototype.removePk = function (pk) {
        var idx = this.itemPrimaryKeys.findIndex(function (p) { return p == pk; });
        if (idx !== -1) {
            this.itemPrimaryKeys.splice(idx, 1);
        }
        return this;
    };
    Object.defineProperty(Scope.prototype, "items", {
        /**
         * get the scope items instances
         */
        get: function () {
            var result = [];
            for (var i = 0; i < this.itemPrimaryKeys.length; i++) {
                var item = this.collection.get(this.itemPrimaryKeys[i]);
                if (item) {
                    result.push(item);
                }
            }
            return result;
        },
        enumerable: true,
        configurable: true
    });
    __decorate([
        mobx_1.observable
    ], Scope.prototype, "itemPrimaryKeys", void 0);
    __decorate([
        mobx_1.observable
    ], Scope.prototype, "loadingFrom", void 0);
    __decorate([
        mobx_1.observable
    ], Scope.prototype, "lastLoadedFrom", void 0);
    __decorate([
        mobx_1.observable
    ], Scope.prototype, "lastLoadedAt", void 0);
    __decorate([
        mobx_1.action.bound
    ], Scope.prototype, "setParams", null);
    __decorate([
        mobx_1.action.bound
    ], Scope.prototype, "load", null);
    __decorate([
        mobx_1.action.bound
    ], Scope.prototype, "addPk", null);
    __decorate([
        mobx_1.action.bound
    ], Scope.prototype, "replacePk", null);
    __decorate([
        mobx_1.action.bound
    ], Scope.prototype, "removePk", null);
    __decorate([
        mobx_1.computed
    ], Scope.prototype, "items", null);
    return Scope;
}());
exports.Scope = Scope;
