SELECT
  mr.id,
  m.serial_number AS "msn",
  mr.meter_id AS "meterId",
  date_on AS "dateOn",
  value,
  mr.type,
  reason,
  mr.created_at AS "createdAt",
  mr.updated_at AS "updatedAt",
  mr.source_system_id AS "sourceSystemId",
  m.mpan
FROM
  meter_reads AS mr
  LEFT JOIN meters AS m
    ON m.id = mr.meter_id
  LEFT JOIN installation_meters AS im
    ON im.id = mr.meter_id
  LEFT JOIN installations AS i
    ON i.id = im.installation_id
  LEFT JOIN contracts AS c
    ON c.id = i.id
WHERE
  mr.deleted_at IS NULL AND c.account_id = $id
ORDER BY
  mr.id desc
OFFSET $offset
LIMIT $perPage
