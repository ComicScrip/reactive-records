![Line coverage percent](https://raw.githubusercontent.com/ComicScrip/reactive-records/master/tests/coverage/badge-lines.svg?sanitize=true)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## [WIP] 
Nothing to see here yet ;)

## Reactive Records ?

Reactive-records lets you describe your app's domain data and its behaviour in a very expressive and DRY manner. 

It relies on the Mobx library to make the records of your model observable and reactive to changes.
It can be used to abstract away data synchronisation with your backend
and also comes with offline capabilities as it handles local persistence and (optimstic/pessimistic) operations for you.

Tired of having your domain logic spread across different places in your app ?
Tired of having to normalize your state ?
Tired of writing CRUD boilerplates ?

Want something that works out of the box, but yet adaptable to your needs ?

You're in the right place ! 

## Goals and assuptions

This lib aims to help you write robust and efficient reactive models for your view layer to consume.

While it tries to be as agnostic as possible concerning the view 
framework or the kind of backend you're using, it does come with a few assumptions about your data. 
Reactive-records was clearly built with the relationnal model in mind, so in order to do anything, the following is assumed :
 - Your business data is composed of ressources objects (Record instances, eg: users, todos, messages, unicorns, ...)
 that have serval poperties you want to display and process. 
 - These ressources are uniquely identified by some sort of primary key ('id' by default).

Reactive-records tries to stay generic, but also pragmatic in its use. That's why it comes with default implementations
that you can ealily extends or override if needed. 

## Getting started : concepts & features

In this section, you will understand the basics of this library through a simple yet realistic music app example. 
For advanced usage, check out the API documentation [TODO : deploy the doc and link it here]

### The core : Records & Collections

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
NOTHING because only the 'name' and 'releaseDate' properties are involved in our reaction, so nothing needs to be re-logged ! 
```

</p>
</details>

### Relationships between Records

Nice ! We have a way to describe the own attributes of our Records.
But real-world apps do not work thanks to isolated domain objects, don't they ? 
So we need to express the relations between the different types of Records we have.
Reactive records lets you use decorators that make some properties behave in a convinient manner, 
and allows you to manipulate your state as a graph, here's how:  

#### "toOne" associations

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
import {albumCollection} from './Data/Ressources/Albums.ts'
import {bandCollection} from './Data/Ressources/Bands.ts'

const album = albumCollection.set({name: 'Exploding Plastic Inevitable'})
// let's programm two reactions to see what's going on as we do the operations
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

The simpliest way to associate the album with a new band is by assigning a POJO representation of the latter
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
Let's programm two reactions to see what's going on as we do the operations : 

```ts
reaction(
    () => album.tracks.map(t => t.name),
    trackNames => console.log("album's tracks names: " + trackNames.join((', ')))
)
reaction(
    () => trackCollection.items.map(t => ({pkValue: t._primaryKeyValue, name: t.name, album_id: t.album_id})),
    tracks => { console.log(`tracksCollection ${JSON.stringify(tracks)}`)}
)
```

The simpliest way to set an album's associated by assigning a POJO representation of the latter.
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

### Basic usage with React

### Tested environements support

- ReactNative 
- [TODO] Browsers : all majors

### Real-world examples

- [TODO] small music app

## Inspirations

- Awesome Rails' ActiveRecord
- mobx-rest

## Dependencies

- mobx
- lodash

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
