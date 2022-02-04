-- account-by-id.query
SELECT
  accounts.id,
  accounts.state,
  array_agg(
    json_build_object(
      'id', contacts.id,
      'name', concat_ws(' ', contacts.title, contacts.first_name, contacts.last_name),
      'email', contacts.email,
      'phone', contacts.phone,
      'address',
      json_build_object(
        'id', addresses.id,
        'addressLine1', addresses.address_line_1,
        'addressLine2', addresses.address_line_2,
        'addressLine3', addresses.address_line_3,
        'city', addresses.city,
        'country', addresses.country,
        'county', addresses.county,
        'postCode', addresses.postCode
      ),
      'isPrimaryContact', (contacts.id = accounts.primary_contact_id)::boolean,
      'isNominatedRecipient', (contacts.id = accounts.nominated_recipient_id)::boolean
    )
  ) AS "contacts",
  json_build_object(
    'beneficiaryAccountNumber', right(accounts.beneficiary_account_number, 3),
    'beneficiaryName', accounts.beneficiary_name,
    'beneficiarySortCode', accounts.beneficiary_sort_code
  ) AS "paymentDetails"
FROM
  accounts
  LEFT JOIN contacts
    ON contacts.account_id = accounts.id
  LEFT JOIN addresses
    ON addresses.id = contacts.address_id
WHERE
  accounts.id = $id
GROUP BY
  accounts.id
