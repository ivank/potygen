import { Type, isTypeEqual, TypeName, isTypeNullable } from '../src';
import { typeBoolean, typeNumber } from '../src/postgres-types-map';

describe('Util', () => {
  it.each<[string, Type, Type, boolean]>([
    [
      'array constants',
      { type: TypeName.Array, postgresType: 'anyarray', items: { type: TypeName.Any, postgresType: 'any' } },
      {
        type: TypeName.Array,
        postgresType: 'int[]',
        items: { type: TypeName.Number, postgresType: 'int', nullable: true },
      },
      true,
    ],
  ])('Should calculate uniq for %s', (name, a, b, expected) => {
    expect(isTypeEqual(a, b)).toEqual(expected);
  });

  it.each`
    type                           | isNullable
    ${typeNumber}                  | ${true}
    ${typeBoolean}                 | ${true}
    ${{ type: TypeName.LoadStar }} | ${false}
  `('Should test nullability', ({ isNullable, type }) => {
    expect(isTypeNullable(type)).toBe(isNullable);
  });
});
