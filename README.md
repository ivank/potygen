# Potygen (Postgres typescript generator)

Pre-Alpha software

Introspect queiries and generate typescript types for them.

- [x] json access
- [x] emit files take const variable name as name
- [ ] Fix "IN" queries
- [x] Add cte queries as additional tables to be loaded and aliased
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
- [x] VSCode plugin
- [x] Refactor into core - combine common logic together into a bigger package, that can be used in different contexts
- [ ] Should be able to use CTE queries as tables in subsequent queries
- [x] Simpler funcitons defined for sql, need to clean them up

# split and simplify comparation expression parsing

This will prove difficult. I need to compute hierarchy of tokens
