import { sql } from '@potygen/potygen';
import { toEachBatch } from '@potygen/pg-stream';
import { Client } from 'pg';

const db = new Client(process.env.POSTGRES_CONNECTION);

async function main() {
  await db.connect();

  // << query
  const productsQuery = toEachBatch(sql`SELECT product FROM orders WHERE region = $region`, { batchSize: 2 });

  await productsQuery(db, { region: 'Sofia' }, async (batch) => {
    console.log(batch);
  });
  // query

  await db.end();
}

main();
