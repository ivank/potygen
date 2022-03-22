CREATE TYPE order_state as ENUM('Pending', 'Paid');

CREATE TABLE authors (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(13) NOT NULL
);

CREATE TABLE books (
  "id" SERIAL PRIMARY KEY,
  "isbn" VARCHAR(13) NOT NULL,
  "title" VARCHAR,
  "author_id" INT REFERENCES authors (id)
);

CREATE TABLE book_orders (
  "id" SERIAL PRIMARY KEY,
  "state" order_state NOT NULL DEFAULT 'Pending'::order_state,
  "book_id" INT REFERENCES books (id),
  "amount" DECIMAL(10,2) NOT NULL,
  "count" INT NOT NULL DEFAULT 1,
  "comment" TEXT
);

INSERT INTO "authors" (id, name)
VALUES
  (1, 'Iain Banks'),
  (2, 'Vernor Vinge');

INSERT INTO "books" (isbn, title, author_id)
VALUES
  ('0-333-45430-8', 'Consider Phlebas', 1),
  ('0-333-47110-5', 'The Player of Games', 1),
  ('0-312-85182-0', 'A Fire Upon the Deep', 2);
