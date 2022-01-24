import { format } from 'prettier';
import * as prettierPluginPgSql from '../src';
import { parser } from '@potygen/potygen';
import { withParserErrors, withoutPos, sqlFiles } from './helpers';

describe('Sql Files', () => {
  it.each(sqlFiles())('Should parse complex sql %s', (name, sql) =>
    withParserErrors(() => {
      const formatted = format(sql, { parser: 'sql', plugins: [prettierPluginPgSql] });
      expect(formatted).toMatchSnapshot(name);
      expect(withoutPos(parser(sql))).toEqual(withoutPos(parser(formatted)));
    }),
  );
});
