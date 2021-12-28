-- active-meters-with-reads.query
SELECT
  meters.id,
  meters.serial_number AS "msn",
  meters.mpan,
  meters.make,
  meters.model,
  installation_meters.meter_type AS "type",
  (
    SELECT
      json_build_object(
        'id', current_reads.id,
        'value', current_reads.value,
        'dateOn', current_reads.date_on,
        'submittedAt', current_reads.submitted_at,
        'reason', current_reads.reason,
        'type', current_reads.type
      ) AS "read"
    FROM active_reads AS current_reads
    WHERE
      current_reads.meter_id = meters.id AND current_reads.type <> 'Meter Verification'
      AND current_reads.date_on BETWEEN $intervalStart! AND $intervalEnd!
    ORDER BY
      current_reads.date_on DESC
    LIMIT 1
  ) AS "currentPeriodRead",
  (
    SELECT
      json_build_object(
        'id', previous_reads.id,
        'value', previous_reads.value,
        'dateOn', previous_reads.date_on,
        'submittedAt', previous_reads.submitted_at,
        'reason', previous_reads.reason,
        'type', previous_reads.type
      ) AS "read"
    FROM active_reads AS previous_reads
    WHERE
      previous_reads.meter_id = meters.id AND previous_reads.type <> 'Meter Verification'
      AND previous_reads.date_on < $intervalStart!
    ORDER BY
      previous_reads.date_on DESC
    LIMIT 1
  ) AS "previousPeriodRead"
FROM
  meters
  JOIN installation_meters
    ON installation_meters.meter_id = meters.id
  JOIN contracts
    ON contracts.installation_id = installation_meters.installation_id
WHERE
  installation_meters.end_on IS NULL AND contracts.account_id = $accountId!
  AND ($meterId::int IS NULL OR meters.id = $meterId)
ORDER BY
  meters.id ASC, installation_meters.meter_type ASC
