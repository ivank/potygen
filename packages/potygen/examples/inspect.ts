import { toInfoContext, loadAllData, completionAtOffset, quickInfoAtOffset } from '@potygen/potygen';
import { Client } from 'pg';

/**
 * Log all operation details to the console
 */
const logger = console;
const db = new Client(process.env.POSTGRES_CONNECTION);
const context = { db, logger };

async function main() {
  await db.connect();

  const data = await loadAllData(context, []);
  const infoContext = toInfoContext(data, logger);

  const sql = `SELECT product FROM orders WHERE region = $region`;
  //                   ^

  const completion = completionAtOffset(infoContext, sql, 7);
  console.log(JSON.stringify(completion, null, 2));

  const quickInfo = quickInfoAtOffset(infoContext, sql, 7);
  console.log(JSON.stringify(quickInfo, null, 2));

  await db.end();
}

main();
