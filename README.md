# Spacetime Client (Browser/Node)

A client to connect to the Spacetime decentralized database.


## Install Spacetime

```bash
npm install @spacetimexyz/spacetime
```
```bash
yarn add @spacetimexyz/spacetime
```

## Initialize the SDK

```typescript
import Spacetime from '@spacetimexyz/spacetime'

const db = new Spacetime({
  ...config
})
```

## Get a single record

You can read data once, by calling the `.doc(id: string).get()` method on a collection.

```ts
const colRef = db.collection("org/places")
const record = await colRef.doc("id").get()

const { id, ...data } = record
```


## Write data 

```ts
const colRef = db.collection("org/places")
const doc = await colRef.doc("london").set({
  name: "London",
  country: "UK",
})
```

