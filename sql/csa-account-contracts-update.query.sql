UPDATE contacts
SET
  phones[1] = COALESCE($phone::text, phones[1]),
  emails[1] = COALESCE($email::text, emails[1]),
  updated_at = $currentDate!
WHERE
  id = $id!
