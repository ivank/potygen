import { sql } from '@potygen/potygen';
import { toAsyncBatchIterator } from '@potygen/pg-stream';
import { Client } from 'pg';

const db = new Client(process.env.POSTGRES_CONNECTION);

async function main() {
  await db.connect();

  // << query
  const productsQuery = toAsyncBatchIterator(sql`SELECT product FROM orders WHERE region = $region`, { batchSize: 2 });

  for await (const batch of productsQuery(db, { region: 'Sofia' })) {
    console.log(batch);
  }
  // query

  await db.end();
}

main();
