import { parser, toQueryInterface } from '@potygen/potygen';

const sql = `SELECT 123 as "col1"`;
const { ast } = parser(sql);
const queryInterface = toQueryInterface(ast);

console.log(queryInterface.results);
