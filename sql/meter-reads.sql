INSERT INTO meter_reads (
  source_system_id,
  meter_id,
  date_on,
  value,
  type,
  reason,
  is_accepted,
  tolerance,
  created_at,
  updated_at
)
SELECT
  mr."MeterReadingId",
  (SELECT meters.id FROM meters WHERE meters.source_system_id = mr."MeterId"),
  mr."DateOfReading",
  mr."MeterReadingValue",
  -- TODO: Verify those are actually what we want from meter reading type
  (
    CASE mr."ReadType"
      WHEN 'Closure' THEN 'Closing'
      WHEN 'Closing' THEN 'Closing'
      WHEN 'Clsoing' THEN 'Closing'
      WHEN 'Final' THEN 'Closing'
      WHEN 'opening' THEN 'Opening'
      WHEN 'Opening' THEN 'Opening'
      WHEN 'Physical' THEN 'Meter Verification'
      WHEN 'Customer' THEN 'Quarterly'
      WHEN 'CUSTOMER' THEN 'Quarterly'
      WHEN '' THEN 'Quarterly'
    END
  )::meter_reads_types,
  mr."ReadReason",
  -- Reads prior to 2021-03-31 are considered to have all been manually verified, so we can safely assign them to "accepted"
  CASE WHEN mr."DateOfReading" <= '2021-03-31' THEN TRUE ELSE FALSE END,
  CASE WHEN mr."DateOfReading" <= '2021-03-31' THEN '{"success":true}'::jsonb ELSE NULL END,
  mr."DateInserted",
  mr."DateUpdated"
FROM
  fit.MeterReading AS mr
  JOIN fit.Meter AS m
    ON m."MeterId" = mr."MeterId"
-- Exclude "Deemed" Export meters, since they don't have an MPAN and are not actual meters
-- TODO: Figure out where to migrate deemed meter reads to.
WHERE
  m."MPAN" IS NOT NULL
ON CONFLICT (source_system_id) WHERE source_system_id IS NOT NULL
  DO UPDATE
    SET
      meter_id = EXCLUDED.meter_id,
      date_on = EXCLUDED.date_on,
      value = EXCLUDED.value,
      type = EXCLUDED.type,
      reason = EXCLUDED.reason,
      -- If the meter read has changed
      -- set the flags to false so we do tolerance checks again
      is_accepted = CASE WHEN meter_reads.value = EXCLUDED.value THEN meter_reads.is_accepted ELSE FALSE END,
      tolerance = CASE WHEN meter_reads.value = EXCLUDED.value THEN meter_reads.tolerance ELSE NULL END,
      created_at = EXCLUDED.created_at,
      updated_at = EXCLUDED.updated_at
