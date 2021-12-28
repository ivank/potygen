INSERT INTO meter_reads (
  meter_id,
  reason,
  "type",
  date_on,
  submitted_at,
  "value"
)
VALUES
  (
    $meterId,
    $reason,
    $type,
    COALESCE($dateOn, CURRENT_DATE),
    COALESCE($submittedAt, CURRENT_DATE),
    COALESCE($value::int, 0)
  )
RETURNING
  id,
  "value",
  meter_id AS "meterId",
  submitted_at AS "submittedAt"
