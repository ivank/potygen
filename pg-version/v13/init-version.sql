CREATE SCHEMA specific_pg_version;
CREATE TABLE specific_pg_version.contacts (
    id SERIAL PRIMARY KEY,
    first_name character varying(35) NOT NULL,
    last_name character varying(35) NOT NULL,
    ts_vector_search tsvector GENERATED ALWAYS AS (to_tsvector('english', first_name || last_name)) STORED
);
