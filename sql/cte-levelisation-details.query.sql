WITH
  items AS (SELECT * FROM account_levelisations WHERE account_levelisations.levelisation_id = $id),
  active_items AS (SELECT * FROM items WHERE state = 'Success' AND is_accepted = TRUE)
SELECT
  levelisations.id AS "id",
  (SELECT COUNT(items.id)::int FROM items) AS "totalCount",
  (SELECT SUM(active_items.export_payment) FROM active_items) AS "fitTotalExportPayment"
FROM levelisations
WHERE
  levelisations.id = $id
