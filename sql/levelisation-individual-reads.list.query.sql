SELECT
  unlevelised_active_reads.id,
  unlevelised_active_reads.date_on AS "dateOn",
  unlevelised_active_reads.value
FROM
  unlevelised_active_reads
  JOIN installation_meters
    ON unlevelised_active_reads.meter_id = installation_meters.meter_id
  JOIN contracts
    ON contracts.installation_id = installation_meters.installation_id
WHERE
  contracts.account_id = $id
LIMIT $limit!::int
OFFSET $offset!::int
