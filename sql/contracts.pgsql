INSERT INTO contracts (
  source_system_id,
  account_id,
  contact_id,
  installation_id,
  generation_tariff_id,
  export_tariff_id,
  generation_percentage_split,
  export_percentage_split,
  scheme_type,
  scheme_account_reference,
  confirmation_on,
  terms_and_conditions_agreed,
  created_at,
  updated_at
)
SELECT
  gai."GenerationAccountInstallationId",
  (SELECT accounts.id FROM accounts WHERE accounts.source_system_id = ca."CustomerAccountId"),
  (SELECT contacts.id FROM contacts WHERE contacts.source_system_id = ca."CustomerId"),
  (SELECT installations.id FROM installations WHERE installations.source_system_id = gai."InstallationId"),
  (
    -- Since tariff information is on the meter, we try to find a meter with type "Generation", and extract its tariff
    SELECT tariffs.id
    FROM fit.InstallationMeter im
    JOIN fit.Meter m ON im."MeterId" = m."MeterId"
    JOIN fit.MeterType mt ON m."MeterTypeId" = mt."MeterTypeId"
    JOIN tariffs ON tariffs.source_system_id = m."TariffId"
    WHERE i."InstallationId" = im."InstallationId" AND mt."MeterTypeTitle" = 'Generation'
    LIMIT 1
  ),
  -- Link to the manually created tariffs for export meters in tariffs.sql.ts
  -- The logic for which one to use is taken from Fit_Proc.usp_Export query in sql-fit db.
  (SELECT tariffs.id FROM tariffs WHERE tariffs.source_system_id = CASE WHEN i."EligibilityDate" < '2012-08-01' THEN 100001 ELSE 100002 END),
  -- Generation Percentage Split.
  -- Since this is a property of the contract, not the meter itself, we move it here from installation meters
  (
    SELECT im."PercentageSplit"
    FROM fit.InstallationMeter im
    JOIN fit.Meter m ON im."MeterId" = m."MeterId"
    JOIN fit.MeterType mt ON m."MeterTypeId" = mt."MeterTypeId"
    WHERE
      i."InstallationId" = im."InstallationId"
      AND mt."MeterTypeTitle" = 'Generation'
      AND im."PercentageSplit" IS NOT NULL
      AND im."PercentageSplit" <> 100
      LIMIT 1
  ),
  -- Export Percentage Split.
  -- Since this is a property of the contract, not the meter itself, we move it here from installation meters
  (
    SELECT im."PercentageSplit"
    FROM fit.InstallationMeter im
    JOIN fit.Meter m ON im."MeterId" = m."MeterId"
    JOIN fit.MeterType mt ON m."MeterTypeId" = mt."MeterTypeId"
    WHERE
      i."InstallationId" = im."InstallationId"
      AND mt."MeterTypeTitle" = 'Export'
      AND im."PercentageSplit" IS NOT NULL
      AND im."PercentageSplit" <> 100
      LIMIT 1
  ),
  -- If it doesn't have a FIT id, and has a SEG id, it must be SEG
  (CASE
    WHEN i."SEGId" IS NOT NULL AND i."CFRFiTId" IS NULL THEN 'SEG'
    ELSE 'FIT'
  END)::contract_scheme_types,
  -- Helper from installations.sql.ts
  COALESCE(SUBSTRING(UPPER(i."CFRFiTId"), '(FIT\\d+)'), i."SEGId", i."CFRFiTId"),
  i."ConfirmationDate",
  TRUE,
  gai."DateInserted",
  gai."DateUpdated"
FROM fit.GenerationAccountInstallation gai
JOIN fit.GenerationAccount ga ON gai."GenerationAccountId" = ga."GenerationAccountId"
JOIN fit.Installation i ON gai."InstallationId" = i."InstallationId"
-- Check if the is "primary account" bit flag is set.
-- Special exception for fit account 422, as it does not have a primary account
JOIN fit.CustomerAccount ca ON ca."FitAccountId" = ga."FitAccountId" AND ((ca."CustomerRoleValue" & 1) > 0 OR ca."FitAccountId" = 422)

ON CONFLICT (source_system_id) WHERE source_system_id IS NOT NULL
DO UPDATE SET
  account_id = EXCLUDED.account_id,
  contact_id = EXCLUDED.contact_id,
  installation_id = EXCLUDED.installation_id,
  generation_tariff_id = EXCLUDED.generation_tariff_id,
  export_tariff_id = EXCLUDED.export_tariff_id,
  scheme_type = EXCLUDED.scheme_type,
  scheme_account_reference = EXCLUDED.scheme_account_reference,
  confirmation_on = EXCLUDED.confirmation_on,
  terms_and_conditions_agreed = EXCLUDED.terms_and_conditions_agreed,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at
