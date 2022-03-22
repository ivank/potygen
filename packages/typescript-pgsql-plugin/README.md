# Typescript template decorator plugin

Adds autocomplete and intellisence to typescript's LSP for potygen's sql template tags. Any editor that supports it would then have those features for the sql template tags.

## Installation

```shell
yarn add --dev @potygen/typesript-pgsql-plugin
```

You will then need to enable it in the typescript config, as well as define the connection to your development postgres db.

```json
{
  "$schema": "http://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "plugins": [
      {
        "name": "@potygen/typescript-pgsql-plugin",
        "connection": "postgresql://localhost:5432/db"
      }
    ]
  }
}
```
