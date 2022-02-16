SELECT
  account_levelisations.id,
  periods."exportType",
  periods."energy"
FROM
  account_levelisations,
  jsonb_to_recordset(generation_periods)
  AS periods(
    "amount" varchar,
    "energy" float,
    "amount" float,
    "startOn" varchar,
    "endOn" varchar,
    "exportType" varchar,
    "technologyType" varchar
  )
