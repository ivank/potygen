import { sql, toQueryConfig } from '@potygen/potygen';

const productsQuery = sql`SELECT product FROM orders WHERE region = $region`;
const queryConfig = toQueryConfig(productsQuery, { region: 'Sofia' });

console.log(queryConfig);
