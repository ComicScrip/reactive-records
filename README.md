![Line coverage percent](https://raw.githubusercontent.com/ComicScrip/reactive-records/master/tests/coverage/badge-lines.svg?sanitize=true)
![Statements coverage percent](https://raw.githubusercontent.com/ComicScrip/reactive-records/master/tests/coverage/badge-statements.svg?sanitize=true)
![Function coverage percent](https://raw.githubusercontent.com/ComicScrip/reactive-records/master/tests/coverage/badge-functions.svg?sanitize=true)
![Branches coverage percent](https://raw.githubusercontent.com/ComicScrip/reactive-records/master/tests/coverage/badge-branches.svg?sanitize=true)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Reactive Records ?

Reactive-records lets you describe your app's domain data and its behaviour in a very expressive and DRY manner. 

It relies on the [Mobx](https://mobx.js.org/) library to make the records of your model observable and reactive to changes.
It can be used to abstract data synchronisation with your backend 
and also comes with offline capabilities as it helps you to implement the custom persistence strategies your 
very special app needs.

## Goals and assuptions

This lib aims to help you write robust and efficient reactive models for your view layer to consume.

While it tries to be as agnostic as possible concerning your JavaScript stack, it does come with a few assumptions about your data. 
Reactive-records was clearly built with the relationnal/object model in mind, so in order to do anything, the following is assumed :
 - Your business data is composed of ressources objects (Record instances, eg: users, todos, messages, unicorns, ...)
 that have serval poperties you want to display and process. 
 - These ressources are uniquely identified by some sort of primary key ('id' by default).

Reactive-records tries to stay generic, but also pragmatic in its use. That's why it comes with default implementations
that you can ealily extend or override if needed. 

## Getting started : concepts & features

In this section, you will understand the basics of this library through a simple (yet realistic) music app example. 

### The core : Records, Collections and Scopes

_Data/Ressources/Albums.ts_
```ts
import {observable} from 'mobx'
import {Collection, Record, ownAttribute} from 'reactive-records'

class Album extends Record {
    // declare @observable properties for oberservers of 
    // this record to be notified as the values are mutated
    // notice how you will have nice autocompletion everywhere (and typechecking if using typescript) ?
    @observable @ownAttribute id: number
    @observable @ownAttribute releaseDate: Date
    @observable @ownAttribute name: string
   
    // use @computed to derive data from @observable properties
    @computed get nameWithReleaseYear() { return `${this.name} (${this.releaseDate.getFullYear()})` }
}

// This collection acts as a store. 
// It will contain all the album records instances 
// and allow to perform operation on the latter as sets and subsets
class AlbumCollection extends Collection<Album> {
    get recordClass(): typeof Album {
        return Album
    }
}

// the collections are typically used as singletons across all the app
export const albumCollection = new AlbumCollection()
```

#### Playing with Records and Collections
_demo.ts_

```ts
import {reaction} from 'mobx'
import {albumCollection} from './Data/Ressources/Albums.ts'

// 'autorun', 'when', 'reaction' or 'observer' functions provided by mobx 
// can be used to react to mutations in your collection or in your records
// let's program a reaction that prints the name and release year of every album in our 
// collection every time those pieces of information are updated
reaction(
    () => albumCollection.items.map(album => album.nameWithReleaseYear),
    displayTitles => {
        // this is for exemple where you can re-render 
        // your UI to always reflect the last state of your data
        console.log(`a simple view of albums in the collection : ${displayTitles.join(', ')}`)
    }
)
```
let's create a new record : the simplest way is to create it directly form the collection thanks to the 'set' method
```ts 
albumCollection.set({id: 123, name: 'Nursery Cryme', releaseDate: new Date('November 12, 1970')})
``` 
<details><summary>See console logs </summary>
<p>

```
"a simple view of albums in the collection : Nursery Cryme (1970)"
```

</p>
</details>

If the provided record representation contains an 'id' (or the primary key you have defined) that is already 
in the collection, the record will be updated.
```ts
albumCollection.set({id: 123, name: 'Nursery Cryme', releaseDate: new Date('November 12, 1971')})
```
<details><summary>See console logs </summary>
<p>

```
"a simple view of albums in the collection : Nursery Cryme (1971)"
```

</p>
</details> 

You can get a particular record in the collection by providing its primary key value
```ts
const album = albumCollection.get(123)
```

You can get meta information about a record's instance, for exemple, ```_ownAtttributeNames``` will retrieve all properties decorated with ```@ownAttribute```

```ts
album._ownAttributesNames // ['id', 'name', 'releaseDate']
album._ownAttributes // {id: 123, name: 'Nursery Cryme', relaseDate: Fri Nov 12 1971
```
If you don't provide a primary key value, a temporary identifier value is given

```ts
const otherAlbum = albumCollection.set({name: 'Foxrot', releaseDate: new Date('October 6, 1972')})
otherAlbum._primaryKeyValue // <random number prefixed by 'optimistic_'>
```

<details><summary>See console logs </summary>
<p>

```
"a simple view of albums in the collection : Nursery Cryme (1971), Foxrot (1972)"
```

</p>
</details>

Woops, there's a typo ! Let's correct that :
```ts
otherAlbum.name = 'Foxtrot'
```

<details><summary>See console logs </summary>
<p>

```
"a simple view of albums in the collection : Nursery Cryme (1971), Foxtrot (1972)"
```

</p>
</details>

For now, ```otherAlbum``` has a temporary identifier. 
Let's assume we saved it in our backend and a real identifier is now available

```ts
otherAlbum.id = 124
```

<details><summary>See console logs </summary>
<p>

```
NOTHING because only the 'name' and 'releaseDate' properties are 
involved in our reaction, so nothing needs to be re-logged ! 
```

</p>
</details>

#### Using scopes

So as we've seen above, records are held in collections and you can access all the records in a collection with the `items` getter :

```ts
myCollection.items // [record1, record2, ...]
```
But what if I want to have the items filtered, or in a specific order ?
What if I have multiple views displaying different subsets of my collection ?

It's time to use scopes ! 
Scopes are just ordered collection subsets. 
They have a ```name``` and hold an ordered list of record primary keys, they can help if you doing pagination, search by attribute, etc. 
Here's an exemple usage : 

```ts
import albumCollection from './Data/Ressources/Albums.ts'

albumCollection.set([
  {id: 1, name: 'The Man Who Sold The World'} 
  {id: 2, name: 'Hunky Dory'} 
  {id: 3, name: 'The Rise And Fall Of Ziggy Stardust And The Spiders From Mars'} 
])

// 'provideScope' will return an existing collection scope or create a new one if it does not exist
const myScope = albumCollection.provideScope('scope1')
myScope.itemPrimaryKeys = [1, 3]
myScope.items.map(a => a.name) 
// ['The Man Who Sold The World', 'The Rise And Fall Of Ziggy Stardust And The Spiders From Mars']

const myOtherScope = albumCollection.provideScope('scope2')
myOtherScope.itemPrimaryKeys = [3, 2]
myScope.items.map(a => a.name) 
// ['The Rise And Fall Of Ziggy Stardust And The Spiders From Mars', 'Hunky Dory']
```

### Relationships between Records

Nice ! We have a way to describe the own attributes of our Records.
But real-world apps do not work thanks to isolated domain objects, don't they ? 
So we need to express the relations between the different types of Records we have.
Reactive records lets you use decorators that make some properties behave in a convinient manner, 
and allows you to manipulate your state as a graph, here's how:  

#### "toOne" associations

_Data/Ressources/Albums.ts_
```ts
import {toOneAssociation, toManyAssociation} from 'reactive-records'

class Album extends Record {
    // ... (attributes)
    
    // a toOne association indicates a strong link between 
    // this record and the foreign record (the band of the album).
    @observable @toOneAssociation({
        foreignCollection: () => bandCollection,
        foreignKeyAttribute: "band_id"
    })  
    band: Band

    // ...
}
```

_demo.ts_

```ts
import {reaction} from 'mobx'
import albumCollection from './Data/Ressources/Albums.ts'
import bandCollection from './Data/Ressources/Bands.ts'

const album = albumCollection.set({name: 'Exploding Plastic Inevitable'})

// let's program two reactions to see what's going on as we do the operations
reaction(() => bandCollection.items, bands => {
  console.log('bandCollection : [' + bands.map(band =>
    JSON.stringify({name: band.name, pkValue: band._primaryKeyValue})
  ).join(',') + ']')
})
reaction(
    () => ({band_id: album.band_id, bandName: album.band ? album.band.name : undefined}), 
    albumState => {
        console.log(`album.band.name : ${albumState.bandName}, album.band_id : ${albumState.band_id}`)
    }
)
```

The simplest way to associate the album with a new band is by assigning a POJO representation of the latter
```ts
album.band = {name: 'The Warlocks'}
```

<details><summary>See console logs </summary>
<p>

```
bandCollection : [{"name":"The Warlocks","pkValue":"optimistic_2"}]
album.band.name : The Warlocks, album.band_id : optimistic_2
```

</p>
</details>

Notice that a new ```Band``` instance is created within the dedicated collection 
```album.band``` now returns a reference to the ```Band``` instance and ```album.band_id``` matches the optimistic 
identifier given to the band (since we did not provide an id).

Let's now assume the band has been saved on the backend and a real identifier is available
```ts
album.band.id = 123
```

<details><summary>See console logs </summary>
<p>

```
bandCollection : [{"name":"The Warlocks","pkValue":123}]
album.band.name : The Warlocks, album.band_id : 123
```

</p>
</details> 

Notice that ```album.band_id``` is kept in sync with ```band.id``` ! 
So you don't ever have to worry about having to update stale ids yourself.

You could also assign an existing band instance to the album : 
```ts
const secondBand = bandCollection.set({name: 'The Falling Spikes', id: 124})
album.band = secondBand
```

<details><summary>See console logs </summary>
<p>

```
bandCollection : [{"name":"The Warlocks","pkValue":123},{"name":"The Falling Spikes","pkValue":124}]
album.band.name : The Falling Spikes, album.band_id : 124
```

</p>
</details> 


The last way of setting up an association is to update the 'foreignKeyAttribute' of the album

```ts
const thirdBand = bandCollection.set({name: 'The Velvet Underground', id: 125})
album.band_id = thirdBand.id
```

<details><summary>See console logs </summary>
<p>

```
bandCollection : [
  {"name":"The Warlocks","pkValue":123},
  {"name":"The Falling Spikes","pkValue":124},
  {"name":"The Velvet Underground","pkValue":125}
]
album.band.name : The Velvet Underground, album.band_id : 125
```

</p>
</details> 

#### "toMany" associations
_Data/Ressources/Albums.ts_
```ts
import {toOneAssociation, toManyAssociation} from 'reactive-records'
import {observable} from 'mobx'

class Album extends Record {
   // ... (attributes)
    
   // a 'toMany' association allows the album to be linked to multiple tracks 
   // interally this is an observable computed value 
   // derived form the tracksCollection items matching the album's _primaryKeyValue 
   @toManyAssociation<Track>({
       foreignKeyAttribute: "album_id",
       foreignCollection: () => trackCollection
   })
   tracks: Array<Track> = []

   // ...
}
```
_Data/Ressources/Albums.ts_
```ts
class Track extends Record {
   // ... (attributes)
   
   // this track is linked to one album thanks to this attribute 
   // which is observed by the 'tracks' attribute decorated by @toManyAssociation
   @observable album_id: PrimaryKey
}
```
demo.ts
```ts
const album = albumCollection.set({ name: "The Velvet Underground and Nico" })
```
Let's program two reactions to see what's going on as we do the operations : 

```ts
reaction(
    () => album.tracks.map(t => t.name),
    trackNames => console.log("album's tracks names: " + trackNames.join((', ')))
)
reaction(
    () => trackCollection.items.map(t => 
        ({pkValue: t._primaryKeyValue, name: t.name, album_id: t.album_id})
    ),
    tracks => { console.log(`tracksCollection ${JSON.stringify(tracks)}`)}
)
```

The simplest way to set an album's associated by assigning a POJO representation of the latter.
```ts
album.tracks = [{name: "Sunday Morning"}, {name: "Venus in Furs"}]
```

<details><summary>See console logs </summary>
<p>

```
tracksCollection [
   {"pkValue":"optimistic_2","name":"Sunday Morning","album_id":"optimistic_1"},
   {"pkValue":"optimistic_3","name":"Venus in Furs","album_id":"optimistic_1"}
]
album's tracks names: Sunday Morning, Venus in Furs
```

</p>
</details> 
Like for 'toOne' associations, the albums set through the association are stored in the foreignCollection

```ts
const otherTrack = trackCollection.set({name: "All Tomorrow's Parties"})
```

<details><summary>See console logs </summary>
<p>

```
tracksCollection [
  {"pkValue":"optimistic_2","name":"Sunday Morning","album_id":"optimistic_1"},
  {"pkValue":"optimistic_3","name":"Venus in Furs","album_id":"optimistic_1"},
  {"pkValue":"optimistic_4","name":"All Tomorrow's Parties"}
]
```

</p>
</details> 

```ts
album.tracks = [otherTrack]
```

<details><summary>See console logs </summary>
<p>

```
tracksCollection [
  {"pkValue":"optimistic_2","name":"Sunday Morning","album_id":null},
  {"pkValue":"optimistic_3","name":"Venus in Furs","album_id":null},
  {"pkValue":"optimistic_4","name":"All Tomorrow's Parties","album_id":"optimistic_1"}
]
album's tracks names: All Tomorrow's Parties
```

</p>
</details> 

Notice how you can pass an exisiting record and how the track list of the album is entirely redifined when assigning an array.
You can also perform operations on the array, like push(), splice(), etc

```ts
album.tracks.push({name: 'There She Goes Again'})
```

<details><summary>See console logs </summary>
<p>

```
tracksCollection [
  {"pkValue":"optimistic_2","name":"Sunday Morning","album_id":null},
  {"pkValue":"optimistic_3","name":"Venus in Furs","album_id":null},
  {"pkValue":"optimistic_4","name":"All Tomorrow's Parties","album_id":"optimistic_1"},
  {"pkValue":"optimistic_7","name":"There She Goes Again","album_id":"optimistic_1"}
]
album's tracks names: All Tomorrow's Parties, There She Goes Again
```

</p>
</details> 

But also element replacement by assignation using record instances of record as POJOs
```ts
album.tracks[0] = trackCollection.items[0]
```

<details><summary>See console logs </summary>
<p>

```
tracksCollection [
  {"pkValue":"optimistic_2","name":"Sunday Morning","album_id":"optimistic_1"},
  {"pkValue":"optimistic_3","name":"Venus in Furs","album_id":null},
  {"pkValue":"optimistic_4","name":"All Tomorrow's Parties","album_id":null},
  {"pkValue":"optimistic_7","name":"There She Goes Again","album_id":"optimistic_1"}
]
album's tracks names: Sunday Morning, There She Goes Again
```

</p>
</details> 

#### Getting a state subgraph out of a record

_Data/Ressources/Albums.ts_
```ts
// <imports>

export class Album extends Record {
  @observable @ownAttribute id: number
  @observable @ownAttribute coverUrl: string
  @observable @ownAttribute name: string
  @observable @ownAttribute releaseDate: Date
  @observable @ownAttribute band_id: PrimaryKey

  @toOneAssociation({
    foreignCollection: () => bandCollection, 
    foreignKeyAttribute: "band_id"
  })
  band: Partial<Band>
  @toManyAssociation<Track>({
    foreignKeyAttribute: "album_id", 
    foreignCollection: () => trackCollection
  })
  tracks: Array<Partial<Track>> = []
}

export class AlbumCollection extends Collection<Album> {
  get recordClass(): typeof Album {
    return Album
  }
}

export const albumCollection = new AlbumCollection()
```

_Data/Ressources/Tracks.ts_
```ts
// <imports>

export class Track extends Record implements TrackAttributes {
  @observable @ownAttribute id: number
  @observable @ownAttribute duration: number = 0
  @observable @ownAttribute name: string = ""
  @observable @ownAttribute album_id: PrimaryKey
}

export class TrackCollection extends Collection<Track> {
  get recordClass(): typeof Track {
    return Track
  }
}

export const trackCollection = new TrackCollection()
```

_Data/Ressources/Bands.ts_
```ts
// <imports>

export class Band extends Record implements BandAttributes {
  @observable @ownAttribute id: number
  @observable @ownAttribute name: string = ""
  @observable 
  @toManyAssociation({
    foreignCollection: () => artistCollection, 
    foreignKeyAttribute: "band_id"
  })
  members: Array<Artist>
}

export class BandCollection extends Collection<Band> {
  get recordClass(): typeof Band {
    return Band
  }
}

export const bandCollection = new BandCollection()
```

_Data/Ressources/Artists.ts_
```ts
// <imports>

export class Artist extends Record {
  @observable @ownAttribute id: number
  @observable @ownAttribute bio: string = "No bio for this artist yet"
  @observable @ownAttribute birthDate: string
  @observable @ownAttribute firstName: string = ""
  @observable @ownAttribute lastName: string = ""

  @computed
  public get fullName() {
    return this.firstName + " " + this.lastName
  }
}

export class ArtistCollection extends Collection<Artist> {
  get recordClass(): typeof Artist {
    return Artist
  }
}

export const artistCollection = new ArtistCollection()
```

_demo.ts_
```ts
const rawAlbum = {
  id: 1,
  name: "Foxtrot",
  tracks: [
    { id: 11, name: "Watcher of the skies", duration: 443 },
    { id: 22, name: "Time table", duration: 286 },
    { name: "Horizons", duration: 101 }
  ],
  band: {
    id: 123,
    name: "Genesis",
    members: [
      {
        id: 1,
        firstName: "Peter",
        lastName: "Gabriel",
        birthDate: "1950-02-13"
      },
      {
        id: 2,
        firstName: "Tony",
        lastName: "Banks",
        birthDate: "1950-03-27"
      },
      {
        id: 3,
        firstName: "Mike",
        lastName: "Rutherford",
        birthDate: "1950-10-02"
      },
      {
        id: 4,
        firstName: "Steve",
        lastName: "Hackett",
        birthDate: "1950-02-12"
      },
      {
        id: 5,
        firstName: "Phil",
        lastName: "Collins",
        birthDate: "1951-01-30"
      }
    ]
  },
  coverUrl: "https://moonunderwaterblog.files.wordpress.com/2016/07/genesis-foxtrot-lp.jpg"
}

const album = albumCollection.set(rawAlbum)
const subgraph = {
  name: undefined, 
  band: {
    name: undefined,
    members: {
      fullName: undefined
    }
  },
  tracks: {
    id: null
  },
  label: 'Unknown label' 
  // final values are treated as defaults, if the corressponding key in the record is undefined
}
album._populate(subgraph)
console.log(subgraph)
```

<details><summary>See console logs </summary>
<p>

```
{
  name: 'Foxtrot',
  band: {
    name: "Genesis",
    members: [
      { fullName: 'Peter Gabriel' },
      { fullName: 'Tony Banks' },
      { fullName: 'Mike Rutherford' },
      { fullName: 'Steve Hackett' },
      { fullName: 'Phil Collins' }
    ]
  },
  tracks: [
    {id: 11},
    {id: 22},
    {id: null}, // the third track does not have an id, null is given since it was provided as default
  ]
  label: 'Unknown label' 
  // album does not have a 'label' prop, default provided in original subgraph is taken
}
```

</p>
</details>

### Dealing with persistence

Good persistence managment is crucial to every app's user experience. It's mostly about : 
- speed : too long loading or processing delays makes a user go away.  
- reliability : stale data might be printed on screen and give false information so we want that data to
reflect the "truth" as often as possible. 
- resilience : What happens if your API is down ? 
What if the user is in the middle of the desert and he would like to access some information 
he has seen earlier, when he had some network access ?

In the real world, implementing data access in an app can be a challenge :
- You may have to deal with asynchronicity
- You want to have your data in a coherent state all the time
- You may have to deal with bad network conditions, handeling possible errors that you cannot prevent, etc

Moreover, there are always tradoffs. 

For exemple, if you want your lists of <whatever> to load super fastly,
you might want to implement some sort of client-side caching. You will have to trade off reliability for speed and resisilence, but 
that can be totally acceptable.

One strategy could be : 

- data is loaded form the server at a time T, we store that data in the local storage of the app. 
- then the next time the loading of data is required, we can directly return what's been saved in the local storage. 

Maybe if current time is less than T + Delay ? It's really up to you to define what's acceptable.  
You could also display that data with a visual indication 
informing the user that it might not be up to date (like reducing the opacity ?)

In the same time, you could send the API a request to make sure the user eventually gets the good version of the system's state.
That way, the user does not have to look at a loading indicator for 5 seconds,
when all he wanted to do was viewing previously loaded data. In the same time he knows that he is in offline mode and
what he sees might not be perfectly up to date, but at least he can see something !

In the browser, you could leverage APIs like localStorage or sessionStorage, or implement an offline service worker that 
caches network calls. In React Native, you can leverage persistence APIs like AsyncStorage or Realm DB, SQLite, ...

The way records are persisted in an application is usually specific to the application.
That's why the persistence layer is completely abstracted in this library, thanks to the ```PersistenceStrategy``` interface.

In a traditonnal application, you often want perform basic operations like : 
- Retrieve items of a collection from a remote data source (like an API) or a local one (like localStorage or AsyncStorage or whatever is avalable in your app's environement)
- Load, save or destroy individual records and sync changes with the data source(s).

These operations are known as "CRUD" operations (Create, Read, Update, Delete). 
In order to stay "DRY" but yet flexible, we can write generic persistence strategies 
that can be shared between our collections (and overriden for a specific collection if necessary).

Before seeing how persistence strategies can be implemented, let's see how to use reactive-records 
persistence methods that will rely on the latter.

#### Using peristence methods in collections, scopes and records

```ts
const createCRUDHandlers = (collectionUrl: string) => {
  // This is a persistence service used by the persistenceStrategy
  // It useses 'axios' to sync data with the REST API  
  return {
    name: 'RESTAPI',
    
    async loadMany(params): Promise<ApiResponse<any>> {
        return axios.get(collectionUrl, params)
    }
    
    // ... other persistence methods
}

const getLocalPersistenceService = (storageKey: string) => {
  // This persistnce service leverages the local storage in the browser 
  // (it could be AsyncStorage on ReactNative, or whatever) 
  return {
    name: 'LOCAL_STORAGE',

    async saveScope(scope: Scope<Record>, rawRecords: any): Promise<any> {
      const { lastLoadedFrom, lastLoadedAt, itemPrimaryKeys, params } = scope
      const payload= {
        scopePks: itemPrimaryKeys.toJS(),
        params,
        lastLoadedAt,
        lastLoadedFrom,
        rawRecords
      }

      return localStorage.set(storageKey + 'scopes/' + scope.name, payload)
    },
    
    async loadScope(scope: Scope<Record>): Promise<ScopePayload> {
      return localStorage.get(storageKey + 'scopes/' + scope.name)
    }

    // ... other persistence methods
  }
}

export class AlbumCollection extends Collection<Album> {
  get recordClass(): typeof Album {
    return Album
  }
}

const offlineFirstAlbums = new OfflineFirstStrategy({
    RESTAPI: createCRUDHandlers("/v1/albums"),
    LOCAL_STORAGE: getLocalPersistenceService("albums/")
})

const albumCollection = new AlbumCollection().setPersistenceStrategy(offlineFirstAlbums)

await albumCollection.load({band_id: 2}, 'scope1') 
// In english : "wait until all the albums that have a band_id equal to 2 
// have been loaded into the albumCollection's scope named 'scope1'"
// It's the PersistenceStrategy responsability to do whatever is needed to achieve that. 
// 'load' will call the collection's persistence strategy's 'loadMany' method 
// passing along the desired collection scope 
// (which points back to the albumCollection with '.collection' attribute)
// and the parameters of the requested subset of albums

// You dont have to specify any parameter if you want to load all records in a scope named 'default'
await albumCollection.load()

// You can load a particular record by providing a primaryKey or an existing record instance 
albumCollection.loadOne(123)

// You can also use persistence methods on records
const myAlbum = albumCollection.get(123)
myAlbum.save() // will call 'saveOne' method of the record's collection's persistenceStrategy
myAlbum.load() // will call 'loadOne' method of the record's collection's persistenceStrategy
myAlbum.destroy() // will call 'destroyOne' method of the record's collection's persistenceStrategy

// There is also shortcut methods on scopes
const s1 = albumCollection.provideScope('scope1')
s1.load({band_id: 1}) // calls 'load' on the collection with the scope's name and provided params
```

Notice how we can separate data manipulaton concerns from persistence concerns ? 
See next section to learn how to deal with those persistence concerns.

#### Implementing generic peristence strategies
In a traditonnal application, you often want perform basic operations like : 
- Retrieve items of a collection from a remote data source (like an API) or a local one (like localStorage or AsyncStorage or whatever is avalable in your app's environement)
- Load, save or destroy individual records and sync changes to the data sources.

These operations are well known as "CRUD" operations (Create, Read, Update, Delete). 
In order to stay "DRY" but yet flexible, we can write generic persistence strategies 
that can be shared between our collections (and overriden by some if necessary).

In order to do that, we just have to implement the ```PersistenceStrategy``` interface.
Here's an exemple of a partial implementation that first use a local persistence service before hitting a remote REST API.

_Data/PersistenceStrategies/OfflineFirstStrategy.ts_
```ts
export class OfflineFirstStrategy implements PersistenceStrategy {
  // A persistence strategy can mix multiple persistence services (data sources) 
  // in order to perform persistence operations on collections, scopes and records.
  persistenceServices = {}
    
  // helper methods
  get localPersistenceService() {
    return this.peristenceServices['LOCAL_STORAGE']
  }
  get remotePersistenceService() {
    return this.peristenceServices['RESTAPI']
  }
  
  async loadMany(params, scope) {
    let records = []
    
    try {
        // First, try to fast-load records form local storage to pre-fill the collection
        scope.loadingFrom = this.localPersistenceService.name
        const localPayload = await this.localPeristenceService.loadScope(scope)
        if (localPayload) {
            // Note that in a real Mobx app, you would maybe user 'runInAction' 
            // or generator functions, see : https://mobx.js.org/best/actions.html
            scope.collection.setMany(localPayload.rawRecords)
            scope.itemPrimaryKeys = localPayload.scopePks
            scope.params = localPayload.params
            scope.lastLoadedAt = new Date()
            scope.lastLoadedFrom = this.localPersistenceService.name
            scope.loadingFrom = null
        }
    } catch (error) { /* handle errors here */ }
    
    try {
        // Then, perform an API request to eventually get the latest data from the server
        scope.loadingFrom = this.remotePersistenceService.name
        const apiResponse = await this.remotePeristenceService.loadMany(params)
        records = scope.collection.setMany(apiResponse.data)
        scope.loadingFrom = null
        scope.lastLoadedAt = new Date()
        scope.lastLoadedFrom = this.remotePersistenceService.name
        // At this point, the API call was successful and we can cache data in local storage 
        // for the next call
        this.localPersistenceService.saveScopeItems(scope, apiResponse.data)
    } catch (error) { /* handle errors here */ }
    
    return records
  }

  // ... other methods ('loadOne', 'saveOne', 'destroyOne')
}

```
## Inspirations

- Awesome Rails' ActiveRecord
- mobx-rest

## FAQ

### Why the heck all method names that are exposed in Record class start with '_' ?

It's because it would be ugglier to pollute Records namespace
with property names that could conflict with your domain data properties. 
Yes, there is a quite vague convention that says '_' shoud be the prefixer of private fields in order to discourage their use in client code. 
But for the Record (Yes, brilliant game of words !), that's what appears to be the most convinient way of achieving the pollution reduction objective 
without affecting the developper experience too much.

Why not use a property called 'attrbitutes' to store data ?

Well, it's just not convinient, just imagine you want to access data on a three-level-deep association :

```album.attributes.band.attributes.members[0].attributes.name```

instead of 

```album.band.members[0].name```

Which one does the least hurt your brain ?

## Contributing

Suggestions are always welcome !
PRs are very welcome too, as long as you test your code :)

## MIT License

Copyright (c) 2019 Pierre Genthon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
