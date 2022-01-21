SELECT
  installations.legacy_fit_db_id AS "cfrFiTId",
  contacts.email AS "email",
  CONCAT(contacts.first_name, ' ', contacts.last_name) AS "contactName",
  customers.company_name AS "company",
  addresses.address_line_1 AS "line1",
  CONCAT(addresses.address_line_2, ' ', addresses.address_line_3) AS "line2",
  addresses.city AS "town",
  addresses.postcode AS "postcode",
  addresses.county AS "county",
  addresses.country AS "country"
FROM
  installations
  JOIN contracts
    ON contracts.installation_id = installations.id
  JOIN accounts
    ON contracts.account_id = accounts.id
  JOIN customers
    ON accounts.customer_id = customers.id
  JOIN contacts
    ON customers.primary_contact_id = contacts.id
  LEFT JOIN addresses
    ON contacts.address_id = addresses.id
WHERE
  installations.legacy_fit_db_id = ANY($fitIds)
