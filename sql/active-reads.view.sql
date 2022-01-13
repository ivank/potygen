SELECT
  meter_reads.id,
  meter_reads.meter_id,
  meter_reads.date_on,
  meter_reads.value,
  meter_reads.type,
  meter_reads.reason,
  meter_reads.created_at,
  meter_reads.updated_at,
  meter_reads.source_system_id,
  meter_reads.checked,
  meter_reads.deleted_at,
  meter_reads.submitted_at,
  meter_reads.history,
  meter_reads.overwritten_at
FROM
  meter_reads
WHERE ((NOT (EXISTS (
        SELECT
          issues.id
        FROM
          issues
        WHERE ((issues.reference_type = 'Read'::issue_reference_type)
          AND (issues.reference_id = meter_reads.id)
          AND ((issues.state IS NULL)
            OR (issues.state = 'Resolved'::issue_state))))))
  AND (meter_reads.deleted_at IS NULL)
  AND (meter_reads.checked IS TRUE)
  AND (meter_reads.overwritten_at IS NULL))
