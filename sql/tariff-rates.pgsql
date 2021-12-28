INSERT INTO tariffs (source_system_id, code, type)
VALUES (100001, 'ALL/EXPORT/01', 'Export'::tariff_types), (100002, 'ALL/EXPORT/02', 'Export'::tariff_types)
ON CONFLICT
  (source_system_id) WHERE source_system_id IS NOT NULL
  DO UPDATE
    SET
      code = EXCLUDED.code, type = EXCLUDED.type, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at
