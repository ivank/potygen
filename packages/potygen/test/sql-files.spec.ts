import { toQuery, isNil } from '../src';
import { toQueryConfig } from '../src/sql';
import { sqlFiles, withParserErrors } from './helpers';

const values: Record<string, Record<string, unknown>> = {
  'account-levelisations-set-bulk-update.query.sql': {
    ids: [1, 2],
  },
  'account-levelisations.query.sql': {
    q: 'test',
    levelisationId: 1,
    resolvedPostlev: true,
    state: 'Active',
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
  'cte-levelisation-details.query.sql': { id: 1 },
  'meter-reads.sql': {},
  'rates-by-tariff-ids.query.sql': {
    ids: [1, 2, 3],
  },
  'all.sql': {
    tableNames: [{ name: 'all_types', schema: 'public' }],
    compositeNames: [{ name: 'inventory_item', schema: 'public' }],
    enumNames: [{ name: 'account_payment_plans', schema: 'public' }],
    functionNames: [{ name: 'concat_ws', schema: 'pg_catalog' }],
  },
  'routines.sql': {},
  'active-meters-wth-reads.query.sql': {
    intervalStart: new Date('2021-12-01'),
    intervalEnd: new Date('2021-12-31'),
    accountId: 1,
    meterId: undefined,
  },
};

describe('Sql Files', () => {
  it.each(
    sqlFiles()
      .map<[string, string, Record<string, unknown>] | undefined>(([filename, text]) =>
        filename in values ? [filename, text, values[filename]] : undefined,
      )
      .filter(isNil),
  )('Should convert complex sql template tags %s', (name, text, params) =>
    withParserErrors(() => {
      expect(toQueryConfig(toQuery(text), params)).toMatchSnapshot(name);
    }),
  );
});
