import { toQueryConfig } from '../../src/template-tag';
import { inspect } from 'util';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { isNil } from '../../src/util';
import { ParserError } from '@ikerin/rd-parse';

const values: Record<string, Record<string, unknown>> = {
  'account-levelisations-set-bulk-update.query.sql': {
    ids: [1, 2],
  },
  'account-levelisations.query.sql': {
    q: 'test',
    levelisationId: 1,
    ids: [2, 3],
    sortField: 'col1',
    sortOrder: 'ASC',
    limit: 1,
    offset: 10,
  },
  'accounts.query.sql': {
    q: 'test',
    ids: [2, 3],
    limit: 1,
    offset: 10,
  },
  'bacs.query.sql': {
    quarter: 'FQ1',
    perPage: 1,
    offset: 2,
  },
  'contracts.sql': {},
  'delete-accounts.query.sql': {},
  'generation-read-data.query.sql': {
    installationId: 1,
    exportDateOn: new Date('2020-01-01'),
  },
  'installation-meter-update.query.sql': {
    removalDate: new Date('2020-01-01'),
    meterId: 1,
  },
  'installations.sql': {},
  'meter-reads.sql': {},
  'rates-by-tarrif-ids.query.sql': {
    ids: [1, 2, 3],
  },
};

describe('Sql Files', () => {
  it.each<[string, string, Record<string, unknown>]>(
    readdirSync(join(__dirname, 'sql'))
      .map<[string, string, Record<string, unknown>] | undefined>((filename) =>
        filename in values
          ? [filename, readFileSync(join(__dirname, 'sql', filename), 'utf-8'), values[filename]]
          : undefined,
      )
      .filter(isNil),
  )('Should convert complex sql template tags %s', (name, text, values) => {
    try {
      expect(toQueryConfig(text)(values)).toMatchSnapshot(name);
    } catch (e) {
      if (e instanceof ParserError) {
        console.log(inspect(e, { depth: 15, colors: true }));
      }
      throw e;
    }
  });
});
