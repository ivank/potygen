import { parser, toQueryInterface, loadQueryInterfacesData, toLoadedQueryInterface } from '../../../src';
import { testDb } from '../../helpers';

describe('Load Types Postgres 13', () => {
  it.each<[string, string]>([['Array remove', `SELECT ARRAY_REMOVE(ARRAY_AGG(id), NULL) FROM all_types`]])(
    'Should convert %s sql (%s)',
    async (_, sql) => {
      const db = testDb();
      await db.connect();
      const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
      const queryInterface = toQueryInterface(parser(sql).ast);
      const data = await loadQueryInterfacesData({ db, logger }, [queryInterface], []);
      const loadedQueryInterface = toLoadedQueryInterface(data)(queryInterface);

      expect(loadedQueryInterface).toMatchSnapshot();
      await db.end();
    },
    20000,
  );
});
