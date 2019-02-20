* Rename the project to 'ReactiveRecords' ? 
* Lifecyle hooks : ability to register, public access to the list. _hooksManager().register()
    * AfterCreate
    * AfterSave
    * BeforeDestroy
    * BeforeSync
    * AfterSync
    * BeforeMutation
control the execution of callbacks
async callbacks
always execute on mobx action

* data synchronizer 

axios
use of http caching system
etags
client sends GET to server
server calculate the retuned payload, make an etag out of it

GET scopes (per url ? (includes search params and pagination))

* complete associations support (has many, belongs to )
* mobx-form integration
* graphQL integration (we could query the Records or the Collections )
* Websocket integration
* Progress indicators for async ops
* CLI ? To generate code ? UML roud-trip ? a web client that deals with a visual representation of the data ?
* Open-API spec ? HATAOAS, JSONAPI ?
* Use it server-side ? would act like a traditionnal ORM
* BI tools ? with a DSL ? integration with a graph library ?
* Support composed primary keys ?


depedency injection for datasync strategy

interface PersistanceService {
    async loadMany(params)
    async loadOne(record)
    async save(record)
    async destroy(record)
}

class ApiClient {
    baseUrl = 'http://myapi.net'
    
    createRessourceCRUDHandlers(collectionUrl) {
        return {
            async loadMany(params) {
                return axios.get(_baseUrl + collectionUrl + params.toQueryString())
            }
            async loadOne(record) {
                return axios.get(_baseUrl + '/v1/albums/' + record._realPrimaryKey)
            }
            async save(record) {
                if (record._realPrimaryKey) {
                   return axios.put(_baseUrl + '/v1/albums/' + record._realPrimaryKey, record._ownAttributes)   
                } else {
                   return axios.post(_baseUrl + '/v1/albums/' + record._realPrimaryKey)
                }
            }
            async destroy(record) {
                
            }
        }
    } 
    
}


class Scope {
    _loading
    _name
    _itemspk = []
    _collection
    _params
    
    get items() {
        _itemspk.map(pk => collection.get(pk))
    }
}

class Record {
    //private possiblyStale = false
    private _lastLoadedFrom = null
    private _touched = false
    private _saving = false
    private _loading = false
    
    load() {
        return this.collection.loadOne(this)
    }
    
    save() {
        return this.collection.save(this)
    }
    
    destroy() {
        return this.collecton.destroy(this)
    }
}

class Collection {
    _scopes = new Map() = {
        'default': new Scope()
    }
    
    _persistanceServices = {
        'remote'
    }
    
    @comp getScopeItems (scopeName) {
        return _scopes.get(scopeName).items
    }
    
    async load(loadOptions = {scopeName: 'default', }) {
        
    }
    
    async loadOne(pk) {
        
    }
    
    async save(pk) {
        
    }
    
    async destroy (pk) {
    
    }
}

myCollection.load({scope: 'myscope', params: {}, from: 'remote'})

myCollection.setSyncStrategy(pessimisticStrategy)

interface SyncronizationStrategy {
    loadMany(scope)
    loadOne(record)
    save(record)
    destroy(record)
}

class PessimisticSyncStrategy implements SyncronizationStrategy {
    async loadMany(scope) {
       scope.loading = true
       const res = await scope.collection.persistanceService('remote').load()
       if (res.ok) {
            scope.collection.setMany(res.data)
            scope._itemspk = res.data.map(item => item[collection.recordClass.primaryKeyName])
       }
       scope.collection.persistanceService('local').save()
       scope.loading = false
    }
}











