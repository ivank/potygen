UPDATE installation_meters SET end_on = $removalDate
WHERE end_on IS NULL
AND meter_id = $meterId
