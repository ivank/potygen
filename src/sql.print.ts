// import {
//   CastTag,
//   DistinctTag,
//   IdentifierTag,
//   ParameterTag,
//   SelectListItemTag,
//   SelectListTag,
//   SelectTag,
//   Tag,
//   TypeTag,
// } from './sql.types';

// interface Values {
//   [key: string]: unknown;
// }

// interface Context {
//   values: { [key: string]: unknown };
//   params: { [key: string]: number };
// }

// interface Result {
//   sql: string;
//   context: Context;
// }

// interface MultipleResult {
//   sql: string[];
//   context: Context;
// }

// const map = (context: Context, items: Tag[]): MultipleResult =>
//   items.reduce<MultipleResult>(
//     (current, item) => {
//       const result = print(context, item);
//       return { sql: current.sql.concat(result.sql), context: result.context };
//     },
//     { context, sql: [] },
//   );

// const join = (separator: string, res: MultipleResult): Result => result(res.context, res.sql.join(separator));
// const format = (format: string, res: Result): Result => result(res.context, format.replace('%s', res.sql));

// const result = (context: Context, sql: string) => ({ context, sql });

// export const print = (context: Context, item: Tag): Result => {
//   switch (item.tag) {
//     case 'Select':
//       return format('SELECT %s', join(' ', map(context, item.values)));
//     case 'SelectList':
//       return join(', ', map(context, item.values));
//     case 'SelectListItem':
//       const listValue = print(context, item.value);
//       return item.as ? format(`%s AS "${item.as}"`, listValue) : listValue;

//     case 'Cast':
//       return format(`CAST (${print(item.value)} AS ${print(item.type)})`;
//     case 'Type':
//       return item.value + (item.param ? `(${item.param})` : '');
//     case 'Parameter':
//       return;
//     case 'Distinct':
//       return 'DISTINCT' + item.values.length ? `ON (${item.values.map(print).join(', ')})` : '';
//     case 'Identifier':
//       return item.value;
//   }
// };

// // const print = {
// //   Select: (tag: SelectTag, values: Values) =>
// //     `SELECT ${tag.values.map((item) => print[item.tag](item, values)).join(' ')}`,

// //   SelectList: (tag: SelectListTag, values: Values) =>
// //     tag.values.map(item => print[item])

// //   SelectListItem: (tag: SelectListItemTag, values: Values) =>
// //     print[tag.value.tag](tag.value, values) + (tag.as ? ` AS ${tag.as}` : ''),
// // };
