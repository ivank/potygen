SELECT
  r.tariff_id AS "tariffId",
  r.rate,
  r.start_date_on AS "startOn",
  t.code AS "tariffCode",
  t.type AS "tariffType",
  r.end_date_on AS "endOn"
FROM
  tariff_rates AS r
  LEFT JOIN tariffs AS t
    ON r.tariff_id = t.id
WHERE
  start_date_on < NOW() AND (end_date_on::date IS NULL OR end_date_on > NOW()) AND t.id IN $$ids
