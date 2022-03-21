import {
  parser,
  toQueryInterface,
  loadQueryInterfacesData,
  toLoadedQueryInterface,
  LoadedData,
} from '@potygen/potygen';
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
  const sql = `SELECT product FROM orders WHERE region = $region`;
  const { ast } = parser(sql);
  const queryInterface = toQueryInterface(ast);

  /**
   * If the data is already present in loadedData, it will not be loaded again
   */
  loadedData = await loadQueryInterfacesData(context, [queryInterface], loadedData);

  const loadedQueryInterface = toLoadedQueryInterface(loadedData)(queryInterface);

  console.log(JSON.stringify(loadedQueryInterface, null, 2));

  await db.end();
}

main();
