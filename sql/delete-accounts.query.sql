DELETE FROM accounts
WHERE
  EXISTS (
    SELECT tariffs.id
    FROM
      contracts
      JOIN tariffs
        ON contracts.generation_tariff_id = tariffs.id
    WHERE
      contracts.account_id = accounts.id AND tariffs.type = 'Generation' AND contracts.scheme_type = $type
  )
  AND accounts.state = $state
RETURNING
  id,
  source_system_id AS "sourceSystemId",
  customer_id AS "customerId"
