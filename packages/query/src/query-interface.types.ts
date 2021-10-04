export interface ColumnType {
  type: 'column';
  table: string;
  schema: string;
  column: string;
}
export interface RecordType {
  type: 'record';
  name: string;
}
export interface LiteralType {
  type: 'literal';
  value: string;
}
export interface FunctionType {
  type: 'function';
  name: string;
  args: PropertyType[];
}
export interface ConditionalType {
  type: 'conditional';
  name: string;
  items: PropertyType[];
}
export interface FunctionArgType {
  type: 'function_arg';
  name: string;
  index: number;
}
export interface StarType {
  type: 'star';
  table: string;
  schema: string;
}
export type ConstantType = 'string' | 'number' | 'boolean' | 'Date' | 'null' | 'json' | 'unknown';
export interface ArrayType {
  type: 'array';
  items: ConstantType | ArrayType | RecordType | UnionType | LiteralType;
}
export interface UnionType {
  type: 'union';
  items: PropertyType[];
}
export type PropertyType =
  | ConstantType
  | ColumnType
  | FunctionType
  | ArrayType
  | RecordType
  | UnionType
  | LiteralType
  | ConditionalType;

export interface Result {
  name: string;
  type: PropertyType | StarType;
}

export interface Param {
  name: string;
  type: PropertyType | FunctionArgType;
  spread?: boolean;
  pos: number;
  lastPos: number;
  required?: boolean;
  pick: Array<{ type?: ColumnType; name: string }>;
}

export interface QueryInterface {
  params: Param[];
  result: Result[];
}
