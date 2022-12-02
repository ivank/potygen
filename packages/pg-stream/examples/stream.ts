import { sql } from '@potygen/potygen';
import { toReadable } from '@potygen/pg-stream';
import { Client } from 'pg';
import { Writable, pipeline } from 'stream';
import { promisify } from 'util';

const asyncPipeline = promisify(pipeline);

const db = new Client(process.env.POSTGRES_CONNECTION);

async function main() {
  await db.connect();

  // << query
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
  // query

  await db.end();
}

main();
