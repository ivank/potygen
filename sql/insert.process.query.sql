INSERT INTO process_items (
  process_id,
  idempotency_key,
  data,
  account_id
)
VALUES
  $$items(
    processId,
    idempotencyKey,
    data,
    accountId
  )
ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL
  DO NOTHING
RETURNING
  id,
  data
