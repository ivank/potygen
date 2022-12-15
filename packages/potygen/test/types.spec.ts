import { Client } from 'pg';
import { toLoadedQueryInterface, Query, SqlInterface, sql, toQueryInterface } from '../src';
import { testDb } from './helpers';
let db: Client;

describe('Query Interface', () => {
  beforeAll(async () => {
    db = testDb();
    await db.connect();
  });

  afterAll(async () => {
    await db.end();
  });

  it.each<[string, Query<SqlInterface<unknown[]>>]>([
    ['aclitem', sql`SELECT 'pg_monitor=r*/pg_read_all_stats'::aclitem`],
    ['cid', sql`SELECT '1'::cid`],
    ['array strings', sql`SELECT ARRAY['one', 'two']`],
    ['array enums', sql`SELECT ARRAY['Pending', 'Done']::account_levelisation_state[]`],
    ['macaddr', sql`SELECT '08:00:2b:01:02:03'::macaddr`],
    ['macaddr8', sql`SELECT '08:00:2b:01:02:03:04:05'::macaddr8`],
    ['pg_lsn', sql`SELECT '16/B374D848'::pg_lsn`],
    ['tid', sql`SELECT '(42,9)'::tid`],
    ['uuid', sql`SELECT 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'::uuid`],
    ['xid', sql`SELECT '1'::xid`],
    ['interval', sql`SELECT '1 day + 1 hour'::interval`],
    ['bytea', sql`SELECT E'\\\\000'::bytea`],
    ['name', sql`SELECT 'day'::name`],
    ['money', sql`SELECT '$1'::money`],
    ['regtype', sql`SELECT '1'::regtype`],
    ['regclass', sql`SELECT '1'::regclass`],
    ['regconfig', sql`SELECT '1'::regconfig`],
    ['regdictionary', sql`SELECT '1'::regdictionary`],
    ['regnamespace', sql`SELECT '1'::regnamespace`],
    ['regoper', sql`SELECT '1'::regoper`],
    ['regoperator', sql`SELECT '1'::regoperator`],
    ['regproc', sql`SELECT '1'::regproc`],
    ['regprocedure', sql`SELECT '1'::regprocedure`],
    ['regrole', sql`SELECT '1'::regrole`],
    ['regtype', sql`SELECT '1'::regtype`],
    ['box', sql`SELECT '(1,2),(3,4)'::box`],
    ['circle', sql`SELECT '<(1,2),3>'::circle`],
    ['line', sql`SELECT '{1,-1,1}'::line`],
    ['lseg', sql`SELECT '(1,2,3,4)'::lseg`],
    ['point', sql`SELECT '(1,2)'::point`],
    ['tsrange', sql`SELECT '[2010-01-01 14:30, 2010-01-01 15:30)'::tsrange`],
    ['numrange', sql`SELECT '[1,2)'::numrange`],
    ['daterange', sql`SELECT '[2010-01-01, 2010-01-02)'::daterange`],
    ['txid_snapshot', sql`SELECT '10:20:10,14,15'::txid_snapshot`],
    ['bit', sql`SELECT E'1'::bit`],
    ['varbit', sql`SELECT E'111'::varbit`],
    ['bpchar', sql`SELECT 'A'::bpchar`],
    ['cidr', sql`SELECT '1.1.1.1/32'::cidr`],
    ['inet', sql`SELECT '::10.2.3.4'::inet`],
    ['int4range', sql`SELECT '[1,2)'::int4range`],
    ['int8range', sql`SELECT '[1,2)'::int8range`],
    ['int2vector', sql`SELECT '1'::int2vector`],
    ['cstring', sql`SELECT '1'::cstring`],
    ['numeric', sql`SELECT '1.2'::numeric`],
    ['path', sql`SELECT '[(1,2),(2,3),(3,4)]'::path`],
    ['polygon', sql`SELECT '((1,2),(2,3),(1,2))'::polygon`],
  ])('Should load type for %s sql', async (_, sql) => {
    const queryInterface = toQueryInterface(sql().ast);
    const loadedQueryInterface = toLoadedQueryInterface([])(queryInterface);
    expect((await sql(db, {}))[0]).toMatchSnapshot();
    expect(loadedQueryInterface).toMatchSnapshot();
  });
});
