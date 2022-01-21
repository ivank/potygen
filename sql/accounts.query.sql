SELECT DISTINCT ON (accounts.id)
  accounts.id,
  accounts.state,
  accounts.start_on AS "startOn",
  contacts.first_name AS "firstName",
  contacts.last_name AS "lastName",
  contacts.email,
  CONCAT_WS(
    ' ',
    installation_addresses.address_line_1,
    installation_addresses.address_line_2,
    installation_addresses.city,
    installation_addresses.postcode
  ) AS "address",
  ARRAY_AGG(contracts.scheme_account_reference) AS "fitIds"
FROM
  accounts
  -- Join all the related tables to do a combined search
  JOIN customers
    ON customers.id = accounts.customer_id
  JOIN contacts
    ON contacts.id = customers.primary_contact_id
  JOIN addresses
    ON addresses.id = contacts.address_id
  JOIN contracts
    ON contracts.account_id = accounts.id
  JOIN installations
    ON contracts.installation_id = installations.id
  JOIN addresses AS installation_addresses
    ON installations.address_id = installation_addresses.id
WHERE
  -- Full text search for each relation, match anything found
  -- Separated into different vectors, so we can take advantage of indexes on each of the tables
  -- Be sure to update the indexes if you update the queries here
  (
    $q = ''
    OR
      (
        to_tsvector('english', accounts.beneficiary_name) @@ plainto_tsquery('english', $q)
        OR
          to_tsvector(
            'english',
            CONCAT_WS(' ', contacts.first_name, contacts.last_name, contacts.email, contacts.phone)
          )
          @@ plainto_tsquery('english', $q)
        OR
          to_tsvector('english', CONCAT_WS(' ', addresses.address_line_1, addresses.address_line_2, addresses.city))
          @@ plainto_tsquery('english', $q)
        OR
          to_tsvector(
            'english',
            CONCAT_WS(
              ' ',
              installation_addresses.address_line_1,
              installation_addresses.address_line_2,
              installation_addresses.city,
              installation_addresses.postcode
            )
          )
          @@ plainto_tsquery('english', $q)
        OR accounts.id::varchar = $q
        OR installations.supply_mpan = $q
        OR installations.export_mpan = $q
        -- Search for direct matches for ids
        OR
          accounts.beneficiary_account_number = $q
        OR contracts.scheme_account_reference = $q
      )
  )
  -- Ids filter, for loading specific ids, skip if empty array
  AND
    (cardinality($ids::int[]) = 0 OR (accounts.id = ANY($ids::int[])))
GROUP BY
  accounts.id,
  accounts.start_on,
  contacts.first_name,
  contacts.last_name,
  contacts.email,
  installation_addresses.address_line_1,
  installation_addresses.address_line_2,
  installation_addresses.city,
  installation_addresses.postcode
-- Pagination
LIMIT $limit::int
OFFSET $offset::int
