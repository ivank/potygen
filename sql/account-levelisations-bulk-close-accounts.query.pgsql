UPDATE accounts
SET state = 'Closed'
FROM account_levelisations
WHERE
  accounts.id = account_levelisations.account_id
  AND accounts.state = 'Pending Loss'
  AND account_levelisations.id = ANY($ids::int[])
  AND account_levelisations.is_accepted = TRUE
  AND (
    account_levelisations.is_bacs_payments_sent = TRUE
    OR account_levelisations.is_cheque_payments_sent = TRUE
  )
RETURNING account_levelisations.id
