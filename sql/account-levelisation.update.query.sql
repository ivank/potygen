UPDATE account_levelisations
SET
  is_accepted = $isAccepted
WHERE
  account_levelisations.id = $id
RETURNING
  id,
  is_accepted AS "isAccepted"
