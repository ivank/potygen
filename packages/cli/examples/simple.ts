import { sql } from '@potygen/potygen';
import { Client } from 'pg';

const db = new Client(process.env.POSTGRES_CONNECTION);

async function main() {
  await db.connect();
  const productsSql = sql`SELECT product FROM orders WHERE region = $region`;
  const data = await productsSql(db, { region: 'Sofia' });

  console.log(data);

  await db.end();
}

main();
