import * as pgp from 'pg-promise';
import { createApp } from './app';

const db = pgp()(process.env.POSTGRES_CONNECTION!);
const port = 3000;

createApp(db).listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
