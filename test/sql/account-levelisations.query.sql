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
  account_levelisations.total_payment AS "totalPayment",
  account_levelisations.vat_payment AS "vatPayment",
  contracts.scheme_account_reference AS "cfrFitId"

FROM account_levelisations
JOIN contracts ON account_levelisations.installation_id = contracts.installation_id
WHERE
  -- Filter
  ($q = '' OR (contracts.scheme_account_reference = $q))
  AND (account_levelisations.levelisation_id = $levelisationId)
  -- Ids filter, for loading specific ids, skip if empty array
  AND (cardinality($ids::int[]) = 0 OR (account_levelisations.id = ANY($ids::int[])))

-- Sort by difference, dateOn, value
ORDER BY
  CASE WHEN $sortField = 'cfrFitId' AND $sortOrder = 'DESC' THEN contracts.scheme_account_reference END DESC,
  CASE WHEN $sortField = 'cfrFitId' AND $sortOrder = 'ASC' THEN contracts.scheme_account_reference END ASC,
  CASE WHEN $sortField = 'state' AND $sortOrder = 'DESC' THEN account_levelisations.state END DESC,
  CASE WHEN $sortField = 'state' AND $sortOrder = 'ASC' THEN account_levelisations.state END ASC,
  CASE WHEN $sortField = 'isAccepted' AND $sortOrder = 'DESC' THEN account_levelisations.is_accepted END DESC,
  CASE WHEN $sortField = 'isAccepted' AND $sortOrder = 'ASC' THEN account_levelisations.is_accepted END ASC

-- Pagination
LIMIT $limit::int OFFSET $offset::int
