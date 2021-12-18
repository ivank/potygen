import { parser } from '@ovotech/potygen-ast';
import { toQueryInterface } from '../src/';
import { sqlFiles, withParserErrors } from './helpers';

describe('Query Interface', () => {
  it.each(sqlFiles())('Should convert complex sql %s', (name, sql) =>
    withParserErrors(() => {
      expect(toQueryInterface(parser(sql))).toMatchSnapshot(name);
    }),
  );
});
