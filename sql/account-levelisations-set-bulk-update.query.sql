UPDATE account_levelisations
SET
  is_cheque_payments_sent = CASE
    WHEN
      EXISTS (SELECT id FROM accounts WHERE accounts.id = account_levelisations.account_id AND payment_plan = 'Cheque')
      THEN TRUE
    ELSE NULL
  END,
  is_bacs_payments_sent = CASE
    WHEN EXISTS (SELECT id FROM accounts WHERE accounts.id = account_levelisations.account_id AND payment_plan = 'BACs')
      THEN TRUE
    ELSE NULL
  END
WHERE
  account_levelisations.id = ANY ($ids::int[]) AND is_accepted = TRUE
RETURNING
  id
