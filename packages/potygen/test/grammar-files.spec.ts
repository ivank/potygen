import { parser } from '../src';
import { sqlFiles, withParserErrors } from './helpers';

describe('Sql Files', () => {
  it.each(sqlFiles())('Should parse complex sql %s', (name, sql) =>
    withParserErrors(() => {
      expect(parser(sql)).toMatchSnapshot(name);
    }),
  );
});
