import { Record, Optional, Static, String, Boolean } from 'runtypes';

export const Config = Record({
  files: Optional(String),
  watch: Optional(Boolean),
  root: Optional(String),
  connection: Optional(String),
  template: Optional(String),
  verbose: Optional(Boolean),
  silent: Optional(Boolean),
  typePrefix: Optional(String),
});

export type ConfigType = Static<typeof Config>;
export type FullConfigType = Required<ConfigType>;

export const toConfig = (config: unknown): FullConfigType => ({
  files: '**/*.sql',
  root: process.cwd(),
  template: '{{dir}}/{{name}}.queries.ts',
  connection: 'postgres://localhost:5432/db',
  watch: false,
  verbose: false,
  silent: false,
  typePrefix: '',
  ...Config.check(config),
});
