import { parser, toQueryInterface } from '@potygen/potygen';

const sql = `SELECT name FROM users WHERE email = $email`;
const { ast } = parser(sql);
const queryInterface = toQueryInterface(ast);

console.log(JSON.stringify(queryInterface, null, 2));
