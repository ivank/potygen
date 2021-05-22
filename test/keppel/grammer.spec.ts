import { readFileSync } from 'fs';
import { join } from 'path';
import { Parser } from '@ikerin/rd-parse';
import { Keppel } from './keppel';

const keppelParser = Parser(Keppel);

describe('Keppel', () => {
  test('Keppel grammar parser generation 1', () => {
    const keppel = readFileSync(join(__dirname, '/test1.keppel'), 'utf8');
    expect(keppelParser(keppel)).toMatchSnapshot();
  });

  test('Keppel grammar parser generation 2', () => {
    const keppel = readFileSync(join(__dirname, '/test2.keppel'), 'utf8');
    expect(keppelParser(keppel)).toMatchSnapshot();
  });

  test('Keppel grammar parser error', () => {
    const keppel = readFileSync(join(__dirname, '/wrong.keppel'), 'utf8');

    expect(() => keppelParser(keppel)).toThrowErrorMatchingSnapshot();
  });
});
