import { isDiffBy, identity, isUnique, isUniqueBy, chunk, groupBy, range } from '../src';

describe('Util', () => {
  it.each<[string, string[], string[]]>([
    ['two not unique', ['one', 'two', 'three', 'three', 'one'], ['one', 'two', 'three']],
    ['one not unique', ['one', 'two', 'three', 'one'], ['one', 'two', 'three']],
  ])('Should calculate uniq for %s', (name, values, expected) => {
    expect(values.filter(isUnique(identity))).toEqual(expected);
    expect(values.filter(isUniqueBy())).toEqual(expected);
  });

  it.each<[string, string[], string[], string[]]>([
    ['two', ['one', 'two', 'three', 'three', 'one'], ['one', 'two'], ['three', 'three']],
    ['one', ['one', 'two', 'three', 'one'], ['one'], ['two', 'three']],
  ])('Should claculate diff for %s', (name, from, to, expected) => {
    expect(from.filter(isDiffBy(identity, to))).toEqual(expected);
  });

  it.each<[string, [start: number, end: number], number[]]>([
    ['two', [0, 3], [0, 1, 2]],
    ['five', [0, 5], [0, 1, 2, 3, 4]],
    ['five starting two', [2, 5], [2, 3, 4]],
  ])('Should generate range for %s', (name, [start, end], expected) => {
    expect(range(start, end)).toEqual(expected);
  });

  it.each<[string, string[], Record<string, string[]>]>([
    ['two', ['one', 'two', 'three', 'three', 'throng'], { th: ['three', 'three', 'throng'], on: ['one'], tw: ['two'] }],
    ['other', ['one', 'once', 'sheep', 'shepherd'], { on: ['one', 'once'], sh: ['sheep', 'shepherd'] }],
  ])('Should group by %s', (name, items, expected) => {
    expect(groupBy((item) => item.slice(0, 2), items)).toEqual(expected);
  });

  it.each<[string, string[], string[][]]>([
    ['odd', ['one', 'two', 'three', 'three', 'throng'], [['one', 'two'], ['three', 'three'], ['throng']]],
    [
      'even',
      ['one', 'two', 'three', 'three', 'throng', 'last'],
      [
        ['one', 'two'],
        ['three', 'three'],
        ['throng', 'last'],
      ],
    ],
  ])('Should chunk for %s', (name, items, expected) => {
    expect(chunk(2, items)).toEqual(expected);
  });
});
