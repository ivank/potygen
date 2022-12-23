import { oneResult, sql } from '@potygen/potygen';
import { Client } from 'pg';

const db = new Client(process.env.POSTGRES_CONNECTION);

interface MyResult {
  product: string;
}

interface MyQuery {
  params: { region?: string };
  result: Array<MyResult>;
}

async function main() {
  await db.connect();

  // << query
  const oneProductQuery = oneResult(sql<MyQuery>`SELECT product FROM orders WHERE region = $region LIMIT 1`);
  const product = await oneProductQuery(db, { region: 'Sofia' });
  console.log(product);
  // query

  await db.end();
}

main();
