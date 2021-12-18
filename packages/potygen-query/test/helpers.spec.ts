import { Type } from '../src';
import { isTypeEqual } from '../src/query-interface';

describe('Util', () => {
  it.each<[string, Type, Type, boolean]>([
    [
      'array constants',
      { type: 'ArrayConstant', items: { type: 'Any' } },
      { type: 'ArrayConstant', items: { type: 'Number', nullable: true } },
      true,
    ],
  ])('Should calculate uniq for %s', (name, a, b, expected) => {
    expect(isTypeEqual(a, b)).toEqual(expected);
  });
});
