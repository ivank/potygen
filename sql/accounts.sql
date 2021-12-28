INSERT INTO accounts (
  source_system_id,
  customer_id,
  state,
  beneficiary_name,
  beneficiary_sort_code,
  beneficiary_account_number,
  payment_plan,
  start_on,
  end_on,
  created_at,
  updated_at
)
SELECT
  ca."CustomerAccountId" AS source_system_id,
  (SELECT id FROM customers WHERE ca."CustomerId" = customers.source_system_id) AS customer_id,
  -- State is spread between FitAccount's Dispute and CustomerAccount "Is Active".
  -- TODO: Do we have old accounts in 'Pending' state?
  (
    CASE
      WHEN ca."IsActive" = TRUE AND fa."IsAccountInDispute" = TRUE THEN 'Dispute'
      WHEN ca."IsActive" = TRUE THEN 'Active'
      ELSE 'Closed'
    END
  )::account_state AS state,
  ba."BankAccountName" AS beneficiary_name,
  ba."BankSortCode" AS beneficiary_sort_code,
  ba."BankAccountNo" AS beneficiary_account_number,
  (
    CASE
      WHEN c."PaymentType" IS NOT NULL AND c."PaymentType" <> '' THEN TRIM(c."PaymentType")::account_payment_plans
      ELSE NULL
    END
  ) AS payment_plan,
  -- start_on - the first opening read
  -- if we don't find an opening read, use first read available as start date
  COALESCE(
    (
      SELECT mr."DateOfReading"
      FROM fit.MeterReading AS mr
      WHERE
        mr."MeterId" = ANY (ARRAY_AGG(im."MeterId")) AND mr."ReadType" = ANY (ARRAY['opening', 'Opening'])
      ORDER BY
        mr."DateOfReading" ASC
      LIMIT 1
    ),
    (
      SELECT mr."DateOfReading"
      FROM fit.MeterReading AS mr
      WHERE
        mr."MeterId" = ANY (ARRAY_AGG(im."MeterId"))
      ORDER BY
        mr."DateOfReading" ASC
      LIMIT 1
    )
  ) AS start_on,
  -- end_on - the last closing read (there might be multiple, we take the last one)
  -- if we don't find a closing read, use last read available as end date,
  -- only for closed accounts as still active accounts shouldn't have end date.
  COALESCE(
    (
      SELECT mr."DateOfReading"
      FROM fit.MeterReading AS mr
      WHERE
        mr."MeterId" = ANY (ARRAY_AGG(im."MeterId"))
        AND mr."ReadType" = ANY (ARRAY['Closure', 'Closing', 'Clsoing', 'Final'])
      ORDER BY
        mr."DateOfReading" DESC
      LIMIT 1
    ),
    CASE ca."IsActive"
      WHEN FALSE
        THEN
        (
          SELECT mr."DateOfReading"
          FROM fit.MeterReading AS mr
          WHERE
            mr."MeterId" = ANY (ARRAY_AGG(im."MeterId"))
          ORDER BY
            mr."DateOfReading" DESC
          LIMIT 1
        )
      ELSE NULL
    END
  ) AS end_on,
  ca."DateInserted" AS created_at,
  ca."DateUpdated" AS updated_at
FROM
  fit.CustomerAccount AS ca
  LEFT JOIN fit.Customer AS c
    ON ca."CustomerId" = c."CustomerId"
  LEFT JOIN fit.FiTAccount AS fa
    ON fa."FiTAccountId" = ca."FitAccountId"
  LEFT JOIN fit.GenerationAccount AS ga
    ON ga."FitAccountId" = ca."FitAccountId"
  LEFT JOIN fit.GenerationAccountInstallation AS gai
    ON gai."GenerationAccountId" = ga."GenerationAccountId"
  LEFT JOIN fit.InstallationMeter AS im
    ON im."InstallationId" = gai."InstallationId"
  LEFT JOIN fit.BankAccount AS ba
    ON ba."GenerationAccountId" = ga."GenerationAccountId" AND ba."IsActive" = TRUE
-- Check if the is "primary account" bit flag is set.
-- Special exception for fit account 422, as it does not have a primary account
WHERE
  ((ca."CustomerRoleValue" & 1) > 0 OR ca."FitAccountId" = 422)
-- Each customer account can have multiple installations,
-- that's why we need to group by actual customer data
-- and leave installation meters as an array for each row to select by
GROUP BY
  ca."CustomerAccountId",
  ca."IsActive",
  fa."IsAccountInDispute",
  ba."BankAccountName",
  ba."BankSortCode",
  ba."BankAccountNo",
  c."PaymentType",
  ca."DateInserted",
  ca."DateUpdated"
ON CONFLICT
  (source_system_id) WHERE source_system_id IS NOT NULL
  DO UPDATE
    SET
      customer_id = EXCLUDED.customer_id,
      start_on = EXCLUDED.start_on,
      end_on = EXCLUDED.end_on,
      state = EXCLUDED.state,
      beneficiary_name = EXCLUDED.beneficiary_name,
      beneficiary_sort_code = EXCLUDED.beneficiary_sort_code,
      beneficiary_account_number = EXCLUDED.beneficiary_account_number,
      payment_plan = EXCLUDED.payment_plan,
      created_at = EXCLUDED.created_at,
      updated_at = EXCLUDED.updated_at
