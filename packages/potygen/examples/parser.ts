import { parser } from '@potygen/potygen';

const sql = `SELECT * FROM users`;
const { ast } = parser(sql);

console.log(ast);
