SELECT
  p.fit_reference "fitId",
  a.beneficiary_name "name",
  p.amount "amount",
  p.levelisation_reference "quarter",
  CONCAT(a.beneficiary_sort_code, a.beneficiary_account_number) as "bankDetails",
  a2.address_line_1 "addressLine1",
  a2.address_line_2 "addressLine2",
  a2.address_line_3 "addressLine3",
  a2.postcode "postcode"
FROM payments p
LEFT JOIN accounts a ON a.id = p.account_id
LEFT JOIN customers c2 ON c2.id = a.customer_id
LEFT JOIN contacts c3 ON c3.id = c2.primary_contact_id
LEFT JOIN addresses a2 ON a2.id = c3.address_id
WHERE
  a.payment_plan = 'BACs' AND p.levelisation_reference = $quarter
LIMIT $perPage OFFSET $offset
