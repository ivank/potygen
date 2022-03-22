import { parser, toQueryInterface, toLoadedQueryInterface, LoadedData, loadAllData } from '@potygen/potygen';
import { Client } from 'pg';

/**
 * Log all operation details to the console
 */
const logger = console;
const db = new Client(process.env.POSTGRES_CONNECTION);
const context = { db, logger };

/**
 * A reusable cache of already laoded data
 */
let loadedData: LoadedData[] = [];

async function main() {
  await db.connect();

  /**
   * Load _all_ data from the given database, all the table, view, type, enum and function data.
   */
  loadedData = await loadAllData(context, loadedData);

  const sql = `SELECT product FROM orders WHERE region = $region`;
  const { ast } = parser(sql);
  const queryInterface = toQueryInterface(ast);
  const loadedQueryInterface = toLoadedQueryInterface(loadedData)(queryInterface);

  console.log(JSON.stringify(loadedQueryInterface, null, 2));

  await db.end();
}

main();
