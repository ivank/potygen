# Potygen (Postgres typescript generator)

Pre-Alpha software

Introspect queiries and generate typescript types for them.

- [x] json access
- [ ] emit files take const variable name as name
- [x] CLI
- [x] views type generation
- [x] load nullability after type cast
- [x] composite types
- [x] load comments
- [ ] split and simplify comparation expression parsing
- [ ] dogfooding our queries, plus use the generated types instead of the hand crafted ones
- [ ] Hardcode native functions + operators
- [x] Standardise tags from grammar
- [x] Prettier for postgres SQL
- [ ] Alter table & create table parsing
- [ ] Prettier binary expression flattening
- [ ] VSCode plugin
- [ ] Refactor into core - combine common logic together into a bigger package, that can be used in different contexts
- [ ] Should be able to use CTE queries as tables in subsequent queries

---

Current state brain dump:

- typescript-pgsql-plugin
- developing the autocomplete columns on "."
- writing integration test to verify
- config in service using cli to be able to use database and load data
