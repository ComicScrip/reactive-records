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
