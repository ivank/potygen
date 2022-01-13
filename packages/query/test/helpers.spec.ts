import { Type } from '../src';
import { isTypeEqual } from '../src/query-interface';

describe('Util', () => {
  it.each<[string, Type, Type, boolean]>([
    [
      'array constants',
      { type: 'ArrayConstant', postgresType: 'anyarray', items: { type: 'Any', postgresType: 'any' } },
      { type: 'ArrayConstant', postgresType: 'int[]', items: { type: 'Number', postgresType: 'int', nullable: true } },
      true,
    ],
  ])('Should calculate uniq for %s', (name, a, b, expected) => {
    expect(isTypeEqual(a, b)).toEqual(expected);
  });
});
