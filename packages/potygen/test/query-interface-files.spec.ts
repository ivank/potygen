import { toQueryInterface, parser } from '../src';
import { sqlFiles, withParserErrors } from './helpers';

describe('Query Interface', () => {
  it.each(sqlFiles())('Should convert complex sql %s', (name, sql) =>
    withParserErrors(() => {
      expect(toQueryInterface(parser(sql).ast)).toMatchSnapshot(name);
    }),
  );
});
