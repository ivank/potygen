-- meter-create.query
INSERT INTO meters (
  id,
  serial_number,
  make,
  model,
  mpan,
  shared,
  hh_metered,
  created_at
)
VALUES
  (
    COALESCE($id::int, nextval('meters_id_seq')),
    $msn,
    $make,
    $model,
    COALESCE($mpan, 'fake'),
    FALSE,
    FALSE,
    $createdAt
  )
ON CONFLICT (id)
  DO UPDATE
    SET
      serial_number = EXCLUDED.serial_number,
      make = EXCLUDED.make,
      model = EXCLUDED.model,
      mpan = EXCLUDED.mpan,
      shared = EXCLUDED.shared,
      hh_metered = EXCLUDED.hh_metered
RETURNING
  id
