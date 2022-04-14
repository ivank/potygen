import { sql } from '@potygen/potygen';

export const myQuery = sql`
  SELECT
    p.fit_reference AS "fitId",
    a.beneficiary_name AS "name",
    p.amount AS "amount",
    p.levelisation_reference AS "quarter",
    CONCAT(a.beneficiary_sort_code, a.beneficiary_account_number) AS "bankDetails",
    a2.address_line_1 AS "addressLine1",
    a2.address_line_2 AS "addressLine2",
    a2.address_line_3 AS "addressLine3",
    a2.postcode AS "postcode",
    date_to_seg_quarter('2020-01-01')
  FROM
    payments AS p
    LEFT JOIN accounts AS a
      ON a.id = p.account_id
    LEFT JOIN customers AS c2
      ON c2.id = a.customer_id
    LEFT JOIN contacts AS c3
      ON c3.id = c2.primary_contact_id
    LEFT JOIN addresses AS a2
      ON a2.id = c3.address_id
  WHERE
    a.payment_plan = 'BACs' AND p.levelisation_reference = $quarter
  LIMIT $perPage
  OFFSET $offset
  `;
