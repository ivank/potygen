SELECT
  levelisations.id AS "id",
  levelisations.quarter AS "quarter",
  levelisations.start_on AS "startOn",
  levelisations.end_on AS "endOn",
  (COUNT(account_levelisations.id))::int AS "totalCount",
  (COUNT(account_levelisations.id) FILTER (WHERE account_levelisations.state = 'Pending'))::int AS "pendingCount",
  (COUNT(account_levelisations.id) FILTER (WHERE account_levelisations.state = 'Error'))::int AS "errorCount",
  (COUNT(account_levelisations.id) FILTER (WHERE account_levelisations.state = 'Success'))::int AS "successCount",
  (COUNT(account_levelisations.id) FILTER (WHERE account_levelisations.is_bacs_payments_sent::boolean = TRUE))::int AS
  "backsSent",
  (COUNT(account_levelisations.id) FILTER (WHERE account_levelisations.is_cheque_payments_sent::boolean = TRUE))::int AS
  "chequeSent",
  (
    SUM(account_levelisations.generation_payment)
    FILTER (WHERE account_levelisations.state = 'Success' AND account_levelisations.is_accepted = TRUE)
  ) AS "totalGenerationPayment",
  (
    SUM(account_levelisations.export_payment)
    FILTER (WHERE account_levelisations.state = 'Success' AND account_levelisations.is_accepted = TRUE)
  ) AS "totalExportPayment",
  (
    SUM(account_levelisations.generation_energy)
    FILTER (WHERE account_levelisations.state = 'Success' AND account_levelisations.is_accepted = TRUE)
  ) AS "totalGenerationEnergy",
  (
    SUM(account_levelisations.export_energy)
    FILTER (WHERE account_levelisations.state = 'Success' AND account_levelisations.is_accepted = TRUE)
  ) AS "totalExportEnergy",
  (
    SUM(account_levelisations.export_energy)
    FILTER (
      WHERE
        account_levelisations.state = 'Success' AND account_levelisations.is_accepted = TRUE
        AND account_levelisations.export_type = 'Metered Export'
    )
  ) AS "totalMeteredExportEnergy",
  (
    SUM(account_levelisations.export_payment)
    FILTER (
      WHERE
        account_levelisations.state = 'Success' AND account_levelisations.is_accepted = TRUE
        AND account_levelisations.export_type = 'Metered Export'
    )
  ) AS "totalMeteredExportPayment",
  (
    SUM(account_levelisations.export_energy)
    FILTER (
      WHERE
        account_levelisations.state = 'Success' AND account_levelisations.is_accepted = TRUE
        AND account_levelisations.export_type = 'Deemed'
    )
  ) AS "totalDeemedExportEnergy",
  (
    SUM(account_levelisations.export_payment)
    FILTER (
      WHERE
        account_levelisations.state = 'Success' AND account_levelisations.is_accepted = TRUE
        AND account_levelisations.export_type = 'Deemed'
    )
  ) AS "totalDeemedExportPayment"
FROM
  levelisations
  LEFT JOIN account_levelisations
    ON account_levelisations.levelisation_id = levelisations.id
WHERE
  levelisations.id = $id
GROUP BY
  levelisations.id
LIMIT 1
