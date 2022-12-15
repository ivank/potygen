import { sql, mapResult } from '@potygen/potygen';
import { toAsyncIterator } from '@potygen/pg-stream';
import { Client } from 'pg';

const db = new Client(process.env.POSTGRES_CONNECTION);

interface MyQuery {
  params: { region?: string };
  result: Array<{ product: string }>;
}

async function main() {
  await db.connect();

  // << query
  const productsQuery = sql<MyQuery>`SELECT product FROM orders WHERE region = $region`;

  const mappedProductsQuery = mapResult(
    (rows) => rows.map((row) => ({ ...row, productLength: row.product.length })),
    productsQuery,
  );

  const secondMappedProductsQuery = mapResult(
    (rows) => rows.map((row) => ({ ...row, productLengthSquare: Math.pow(row.productLength, 2) })),
    mappedProductsQuery,
  );

  const productsIterator = toAsyncIterator(secondMappedProductsQuery, { batchSize: 2 });

  for await (const item of productsIterator(db, { region: 'Sofia' })) {
    console.log(item);
  }
  // query

  await db.end();
}

main();
