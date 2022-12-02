# Stream processing for potygen using node-postgres

Perform streaming query with [@potygen/potygen](../potygen/).

Supports:

- async iterators
- node streams
- forEach function

Allows you to use Cursor to split up a big query response and retrieve only a subsection of it at a time, efficiently iterating through it. And helps integrating with other tools that use generators / node-streams.

## Each Batch

The simplest of the helpers just calls a callback for each "batch" of items until all the results have been exhaousted.

> [examples/each-batch.ts:(query)](https://github.com/ivank/potygen/tree/main/packages/pg-stream/examples/each-batch.ts#L10-L16)

```ts
const productsQuery = toEachBatch(sql`SELECT product FROM orders WHERE region = $region`, { batchSize: 2 });

await productsQuery(db, { region: 'Sofia' }, async (batch) => {
  console.log(batch);
});
```

## Async Iterator

Utilizing [javascript's async iterators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of) you can iterate through the results by keeping only a single batch in memory, using the humble for of loop.

> [examples/async-iterator.ts:(query)](https://github.com/ivank/potygen/tree/main/packages/pg-stream/examples/async-iterator.ts#L10-L16)

```ts
const productsQuery = toAsyncIterator(sql`SELECT product FROM orders WHERE region = $region`, { batchSize: 2 });

for await (const item of productsQuery(db, { region: 'Sofia' })) {
  console.log(item);
}
```

## Async Batch Iterator

The same as the `toAsyncIterator`, but keeps the batches intact and retrieves them whole.

> [examples/async-batch-iterator.ts:(query)](https://github.com/ivank/potygen/tree/main/packages/pg-stream/examples/async-batch-iterator.ts#L10-L16)

```ts
const productsQuery = toAsyncBatchIterator(sql`SELECT product FROM orders WHERE region = $region`, { batchSize: 2 });

for await (const batch of productsQuery(db, { region: 'Sofia' })) {
  console.log(batch);
}
```

## Stream

You can also utilize [node streams](https://nodejs.org/api/stream.html) to process the data either in batches or one by one

> [examples/stream.ts:(query)](https://github.com/ivank/potygen/tree/main/packages/pg-stream/examples/stream.ts#L14-L28)

```ts
const productsQuery = toReadable(sql`SELECT product FROM orders WHERE region = $region`, { batchSize: 2 });

const sink = new Writable({
  objectMode: true,
  write: (chunk, encoding, callback) => {
    console.log(chunk);
    callback();
  },
});
const source = productsQuery(db, { region: 'Sofia' });

await asyncPipeline(source, sink);
console.log('Done');
```
