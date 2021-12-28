SELECT
  account_levelisations.id AS "id",
  account_levelisations.levelisation_id AS "levelisationId",
  account_levelisations.account_id AS "accountId",
  account_levelisations.installation_id AS "installationId",
  account_levelisations.state AS "state",
  account_levelisations.is_accepted AS "isAccepted",
  account_levelisations.generation_start_read_on AS "generationStartReadOn",
  account_levelisations.generation_start_read_value AS "generationStartReadValue",
  account_levelisations.generation_end_read_on AS "generationEndReadOn",
  account_levelisations.generation_end_read_value AS "generationEndReadValue",
  account_levelisations.generation_percentage_split AS "generationPercentageSplit",
  account_levelisations.generation_payment AS "generationPayment",
  account_levelisations.generation_energy AS "generationEnergy",
  account_levelisations.export_start_read_on AS "exportStartReadOn",
  account_levelisations.export_start_read_value AS "exportStartReadValue",
  account_levelisations.export_end_read_on AS "exportEndReadOn",
  account_levelisations.export_end_read_value AS "exportEndReadValue",
  account_levelisations.export_percentage_split AS "exportPercentageSplit",
  account_levelisations.export_payment AS "exportPayment",
  account_levelisations.export_energy AS "exportEnergy",
  account_levelisations.export_type AS "exportType",
  account_levelisations.technology_type AS "technologyType",
  account_levelisations.total_payment AS "totalPayment",
  account_levelisations.vat_payment AS "vatPayment",
  account_levelisations.generation_periods AS "generationPeriods",
  account_levelisations.export_periods AS "exportPeriods",
  issues.payload ->> 'code' AS "errorCode",
  issues.payload -> 'params' AS "errorParams",
  contracts.scheme_account_reference AS "cfrFitId",
  account_levelisations.resolved_postlev_id AS "resolvedPostlevId",
  account_levelisations.is_bacs_payments_sent AS "isBacsPaymentsSent",
  account_levelisations.is_cheque_payments_sent AS "isChequePaymentsSent"
FROM
  account_levelisations
  LEFT JOIN issues
    ON issues.reference_id = account_levelisations.id AND issues.reference_type = 'Account Levelisation'
    AND issues.type = 'Account Levelisation'
  JOIN contracts
    ON account_levelisations.installation_id = contracts.installation_id
WHERE
  -- Filter
  ($q = '' OR (contracts.scheme_account_reference = $q))
  AND
    (
      $resolvedPostlev = ''
      OR ($resolvedPostlev::BOOLEAN = TRUE AND account_levelisations.resolved_postlev_id IS NOT NULL)
    )
  AND ($state::account_levelisation_state IS NULL OR (account_levelisations.state = $state))
  -- Ids filter, for loading specific ids, skip if empty array
  AND
    ($levelisationId::int IS NULL OR account_levelisations.levelisation_id = $levelisationId)
  AND (cardinality($ids::int[]) = 0 OR (account_levelisations.id = ANY ($ids::int[])))
-- Sort by difference, dateOn, value
ORDER BY
  CASE WHEN $sortField = 'totalPayment' AND $sortOrder = 'DESC' THEN account_levelisations.total_payment END DESC,
  CASE WHEN $sortField = 'totalPayment' AND $sortOrder = 'ASC' THEN account_levelisations.total_payment END ASC,
  CASE WHEN $sortField = 'vatPayment' AND $sortOrder = 'DESC' THEN account_levelisations.vat_payment END DESC,
  CASE WHEN $sortField = 'vatPayment' AND $sortOrder = 'ASC' THEN account_levelisations.vat_payment END ASC,
  CASE WHEN $sortField = 'generationPayment' AND $sortOrder = 'DESC' THEN account_levelisations.generation_payment END
  DESC,
  CASE WHEN $sortField = 'generationPayment' AND $sortOrder = 'ASC' THEN account_levelisations.generation_payment END
  ASC,
  CASE WHEN $sortField = 'exportPayment' AND $sortOrder = 'DESC' THEN account_levelisations.export_payment END DESC,
  CASE WHEN $sortField = 'exportPayment' AND $sortOrder = 'ASC' THEN account_levelisations.export_payment END ASC,
  CASE WHEN $sortField = 'generationEnergy' AND $sortOrder = 'DESC' THEN account_levelisations.generation_energy END
  DESC,
  CASE WHEN $sortField = 'generationEnergy' AND $sortOrder = 'ASC' THEN account_levelisations.generation_energy END ASC,
  CASE WHEN $sortField = 'exportEnergy' AND $sortOrder = 'DESC' THEN account_levelisations.export_energy END DESC,
  CASE WHEN $sortField = 'exportEnergy' AND $sortOrder = 'ASC' THEN account_levelisations.export_energy END ASC,
  CASE WHEN $sortField = 'cfrFitId' AND $sortOrder = 'DESC' THEN contracts.scheme_account_reference END DESC,
  CASE WHEN $sortField = 'cfrFitId' AND $sortOrder = 'ASC' THEN contracts.scheme_account_reference END ASC,
  CASE WHEN $sortField = 'state' AND $sortOrder = 'DESC' THEN account_levelisations.state END DESC,
  CASE WHEN $sortField = 'state' AND $sortOrder = 'ASC' THEN account_levelisations.state END ASC,
  CASE WHEN $sortField = 'isAccepted' AND $sortOrder = 'DESC' THEN account_levelisations.is_accepted END DESC,
  CASE WHEN $sortField = 'isAccepted' AND $sortOrder = 'ASC' THEN account_levelisations.is_accepted END ASC,
  CASE WHEN $sortField = 'error' AND $sortOrder = 'DESC' THEN issues.payload ->> 'code' END DESC,
  CASE WHEN $sortField = 'error' AND $sortOrder = 'ASC' THEN issues.payload ->> 'code' END ASC,
  CASE WHEN $sortField = 'exportType' AND $sortOrder = 'DESC' THEN account_levelisations.export_type::text END DESC,
  CASE WHEN $sortField = 'exportType' AND $sortOrder = 'ASC' THEN account_levelisations.export_type::text END ASC
-- Pagination
LIMIT $limit::int
OFFSET $offset::int
