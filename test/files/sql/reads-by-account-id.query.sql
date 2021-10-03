SELECT
  mr.id,
  m.serial_number aS "msn",
  mr.meter_id as "meterId",
  date_on as "dateOn",
  value,
  mr.type,
  reason,
  mr.created_at as "createdAt",
  mr.updated_at as "updatedAt",
  mr.source_system_id as "sourceSystemId",
  m.mpan
FROM meter_reads mr
       left join meters m
                 on m.id = mr.meter_id
       left join installation_meters im
                 on im.id = mr.meter_id
       left join installations i
                 on i.id = im.installation_id
       left join contracts c
                 on c.id = i.id
where mr.deleted_at IS NULL
AND c.account_id = $id
order by mr.id desc
offset $offset
limit $perPage
