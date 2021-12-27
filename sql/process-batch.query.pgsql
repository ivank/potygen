SELECT
  installations.legacy_fit_db_id as "cfrFiTId",
  contacts.email as "email",
  CONCAT(contacts.first_name,' ', contacts.last_name) as "contactName",
  customers.company_name as "company",
  addresses.address_line_1 as "line1",
  CONCAT(addresses.address_line_2 ,' ', addresses.address_line_3) as "line2",
  addresses.city as "town",
  addresses.postcode as "postcode",
  addresses.county as "county",
  addresses.country as "country"
FROM installations
JOIN contracts ON contracts.installation_id = installations.id
JOIN accounts ON contracts.account_id = accounts.id
JOIN customers ON accounts.customer_id = customers.id
JOIN contacts ON customers.primary_contact_id = contacts.id
LEFT JOIN addresses ON contacts.address_id = addresses.id
WHERE installations.legacy_fit_db_id = ANY($fitIds)
