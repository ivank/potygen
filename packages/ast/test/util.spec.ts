import { diffBy, identity, uniqBy } from '../src';

describe('Util', () => {
  it.each<[string, string[], string[]]>([
    ['two not unique', ['one', 'two', 'three', 'three', 'one'], ['one', 'two', 'three']],
    ['one not unique', ['one', 'two', 'three', 'one'], ['one', 'two', 'three']],
  ])('Should calculate uniq for %s', (name, values, expected) => {
    expect(uniqBy(identity, values)).toEqual(expected);
  });

  it.each<[string, string[], string[], string[]]>([
    ['two', ['one', 'two', 'three', 'three', 'one'], ['one', 'two'], ['three', 'three']],
    ['one', ['one', 'two', 'three', 'one'], ['one'], ['two', 'three']],
  ])('Should claculate diff for %s', (name, from, to, expected) => {
    expect(diffBy(identity, from, to)).toEqual(expected);
  });
});
