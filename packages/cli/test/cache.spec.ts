import { Cache } from '../src';

describe('Cache', () => {
  it('Should have a last resource utilized cache', () => {
    const cache = new Cache<string, number>(4);

    cache.set('one', 1);
    cache.set('two', 2);
    cache.set('three', 3);
    cache.set('four', 4);

    // Full Cache
    expect(cache.get('one')).toBe(1);
    expect(cache.get('two')).toBe(2);
    expect(cache.get('three')).toBe(3);
    expect(cache.get('four')).toBe(4);

    // Discard old
    cache.set('five', 5);

    expect(cache.get('one')).toBe(undefined);
    expect(cache.get('two')).toBe(2);
    expect(cache.get('three')).toBe(3);
    expect(cache.get('four')).toBe(4);
    expect(cache.get('five')).toBe(5);

    // Discard old
    cache.set('six', 6);

    expect(cache.get('one')).toBe(undefined);
    expect(cache.get('two')).toBe(undefined);
    expect(cache.get('three')).toBe(3);
    expect(cache.get('four')).toBe(4);
    expect(cache.get('five')).toBe(5);
    expect(cache.get('six')).toBe(6);
  });
});
