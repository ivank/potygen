import { parser } from '@psql-ts/ast';
import { toQueryInterface } from '../src/';
import { sqlFiles, withParserErrors } from './helpers';

describe('Query Interface', () => {
  it.each(sqlFiles())('Should convert complex sql %s', (name, sql) =>
    withParserErrors(() => {
      const ast = parser(sql);
      expect(toQueryInterface(ast!)).toMatchSnapshot(name);
    }),
  );
});
