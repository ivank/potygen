SELECT meter_reads.date_on AS "dateOn", meter_reads.value
FROM meter_reads JOIN installation_meters ON meter_reads.meter_id = installation_meters.meter_id
WHERE
  installation_meters.installation_id = $installationId AND installation_meters.meter_type = 'Generation'
  AND meter_reads.deleted_at IS NULL
  AND meter_reads.type <> 'Meter Verification'
  AND meter_reads.is_accepted = TRUE
ORDER BY
  ABS(meter_reads.date_on - $exportDateOn::date) ASC
LIMIT 1
