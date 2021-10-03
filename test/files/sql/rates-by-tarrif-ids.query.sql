SELECT
  r.tariff_id as "tariffId",
  r.rate,
  r.start_date_on as "startOn",
  t.code as "tariffCode",
  t.type as "tariffType",
  r.end_date_on as "endOn"
from tariff_rates r
LEFT JOIN tariffs t on r.tariff_id = t.id
where start_date_on < NOW() and (end_date_on::date IS NULL OR end_date_on > NOW()) AND t.id IN $$ids
