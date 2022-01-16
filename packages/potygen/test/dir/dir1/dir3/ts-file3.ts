const other = <T extends string>(test: TemplateStringsArray): T => '' as T;

export const tag = other<any>`SELECT * FROM table`;
