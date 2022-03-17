WITH
  overwritten_reads AS
  (
    UPDATE meter_reads
    SET
      overwritten_at = $currentDate
    WHERE
      meter_id = $meterId AND submitted_at BETWEEN $intervalStart AND $intervalEnd
  )
UPDATE issues
SET
  state = 'Closed'
WHERE
  reference_id = overwritten_reads.id AND reference_type = 'Read' AND state = 'Open'
