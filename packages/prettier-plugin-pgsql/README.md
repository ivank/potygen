# Postgres sql prettier plugin

Plugin for formatting postgres SQL

## Installation

```shell
yarn add --dev @potygen/prettier-plugin-pgsql
```

Which should allow you to format sql files

```shell
prettier --write **/*.sql
```

## SQL Template String

Since potygen is built to work with sql template strings, as they are much more ergonomic in typescript, the native prettier plugins are still not enough. Prettier itself does not support custom sql template strings, outside its predifined ones - this issue is tracked here: https://github.com/prettier/prettier/issues/4424

To get around this I've created a very simple patch to prettier code and will publish a patched version at [@potygen/prettier](http://npmjs.com/package/@potygen/prettier) for the time being, until a proper solution is found.

To set it up you need to force yarn (or npm) to load "prettier" from another repo. The code is the same, just adds "sql" as an additional template string that is then able to be extended by the plugin.

```json
{
  "devDependencies": {
    "prettier": "npm:@potygen/prettier@^3.0.3"
  }
}
```
