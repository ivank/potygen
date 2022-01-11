// import { toDocument } from '../src/service';
// import { toPath, getSourceItem } from '../src/traverse';
import { removeDotCompletion } from '../src/potygen-template-language-service';
import * as tss from 'typescript/lib/tsserverlibrary';

describe('Test Service', () => {
  it.each<[string, tss.LineAndCharacter, string]>([
    [
      `
  SELECT id. FROM all_types SELECT
`,
      { line: 1, character: 12 },
      `
  SELECT id.id FROM all_types SELECT
`,
    ],
    [
      `
  SELECT all_types. FROM all_types SELECT
`,
      { line: 1, character: 19 },
      `
  SELECT all_types.id FROM all_types SELECT
`,
    ],
    [
      `
  SELECT all_types...asd,asd FROM all_types SELECT
`,
      { line: 1, character: 19 },
      `
  SELECT all_types.id FROM all_types SELECT
`,
    ],
  ])('Should remove dot completion', (sql, position, expected) => {
    expect(removeDotCompletion(sql, position)).toEqual(expected);
  });

  // it('Should parse complex sql %s', () => {
  //   const doc = toDocument(`SELECT t.id, t.asd FROM all_types AS t`);
  //   console.log(getSourceItem(toPath(doc.ast, 16)));
  // });
});
