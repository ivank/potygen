import { sql } from '@potygen/potygen';
import { toAsyncIterator } from '@potygen/pg-stream';
import { Client } from 'pg';

const db = new Client(process.env.POSTGRES_CONNECTION);

async function main() {
  await db.connect();

  // << query
  const productsQuery = toAsyncIterator(sql`SELECT product FROM orders WHERE region = $region`, { batchSize: 2 });

  for await (const item of productsQuery(db, { region: 'Sofia' })) {
    console.log(item);
  }
  // query

  await db.end();
}

main();
