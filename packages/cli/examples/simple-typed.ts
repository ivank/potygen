import { sql } from '@potygen/potygen';
import { Client } from 'pg';
import { ProductsSqlQuery } from './simple-typed.queries';

const db = new Client(process.env.POSTGRES_CONNECTION);

async function main() {
  await db.connect();
  const productsSql = sql<ProductsSqlQuery>`SELECT product FROM orders WHERE region = $region`;
  const data = await productsSql(db, { region: 'Sofia' });

  console.log(data);

  await db.end();
}

main();
