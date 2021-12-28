INSERT INTO installations (
  source_system_id,
  address_id,
  name,
  type,
  technology_type,
  property_type,
  export_type,
  commissioned_on,
  decommissioned_on,
  eligibility_start_on,
  eligibility_end_on,
  installed_on,
  verified_on,
  reverified_on,
  inspected_on,
  mcs_reference,
  tic_reference,
  dnc_reference,
  roofit_reference,
  name_of_grant,
  value_of_grant,
  date_grant_repaid,
  epc_rate,
  epc_date,
  epc_number,
  has_battery_storage,
  battery_installation_date_on,
  export_mpan,
  supply_mpan,
  switched_from,
  switched_to,
  switched_on,
  legacy_fit_db_id,
  created_at,
  updated_at
)
SELECT
  i."InstallationId",
  (SELECT addresses.id FROM addresses WHERE addresses.source_system_id = i."AddressId"),
  i."InstallationName",
  it."InstallationTypeTitle"::installation_types,
  gtt."GeneratorTechnologyTypeRef"::installation_technology_types,
  pt."PropertyTypeTitle"::installation_property_type,
  (
    CASE i."ExportType"
      WHEN NULL THEN NULL
      WHEN 'SEG' THEN NULL
      WHEN 'Deemed' THEN 'Deemed'
      WHEN 'Off_Grid' THEN 'Off Grid'
      WHEN 'PPA_OVO' THEN 'PPA'
      WHEN 'Metered_Standard_Tariff' THEN 'Metered Export'
      WHEN 'PPA_Other' THEN 'PPA'
    END
  )::installation_export_type,
  i."TariffDate",
  i."DecommisionedDate",
  i."EligibilityDate",
  i."EligibilityEndDate",
  i."DateInstalled",
  -- Get the first verification date
  (
    SELECT ivi."DateVerified"
    FROM fit.InstallationVerificationInfo AS ivi
    WHERE
      ivi."InstallationId" = i."InstallationId"
    ORDER BY
      ivi."DateVerified" ASC
    LIMIT 1
  ),
  -- Get the last verification date
  -- If there are more than 2 verification dates, get the latest one
  (
    SELECT (ARRAY_AGG("DateVerified" ORDER BY "DateVerified" DESC))[1]
    FROM fit.InstallationVerificationInfo AS ivi
    WHERE
      ivi."InstallationId" = i."InstallationId"
    GROUP BY
      "InstallationId"
    HAVING
      COUNT("InstallationId") > 1
  ),
  i."ConfirmationDate",
  i."MCSInstallerCertificateNo",
  i."InstalledCapacity",
  i."InstalledCapacity",
  i."ROOFITNo",
  i."NameOfGrant",
  i."ValueOfGrant",
  i."DateGrantRepaid",
  i."EPCRate",
  i."DateInstalled",
  NULL,
  NULL,
  NULL,
  (
    SELECT m."MPAN"
    FROM
      fit.InstallationMeter AS im
      JOIN fit.Meter AS m
        ON m."MeterId" = im."MeterId"
      JOIN fit.MeterType AS mt
        ON m."MeterTypeId" = mt."MeterTypeId"
    WHERE
      mt."MeterTypeTitle" = 'Export' AND im."InstallationId" = i."InstallationId"
    LIMIT 1
  ),
  c."SupplyMPAN",
  (
    SELECT s."Company"
    FROM fit.Switch AS s
    WHERE
      s."InstallationId" = i."InstallationId" AND s."IsSwitchIn" = TRUE
    ORDER BY
      s."DateInserted" DESC
    LIMIT 1
  ),
  (
    SELECT s."Company"
    FROM fit.Switch AS s
    WHERE
      s."InstallationId" = i."InstallationId" AND s."IsSwitchIn" = FALSE
    ORDER BY
      s."DateInserted" DESC
    LIMIT 1
  ),
  (
    SELECT s."ActualSwitchDate"
    FROM fit.Switch AS s
    WHERE
      s."InstallationId" = i."InstallationId"
    ORDER BY
      s."DateInserted" DESC
    LIMIT 1
  ),
  -- Preserve the original CFRFiTId
  i."CFRFiTId",
  i."DateInserted",
  i."DateUpdated"
FROM
  fit.Installation AS i
  JOIN fit.InstallationType AS it
    ON it."InstallationTypeId" = i."InstallationTypeId"
  JOIN fit.GeneratorTechnologyType AS gtt
    ON gtt."GeneratorTechnologyTypeId" = i."GeneratorTechnologyTypeId"
  JOIN fit.PropertyType AS pt
    ON pt."PropertyTypeId" = i."PropertyTypeId"
  JOIN fit.GenerationAccountInstallation AS gai
    ON gai."InstallationId" = i."InstallationId"
  JOIN fit.GenerationAccount AS ga
    ON ga."GenerationAccountId" = gai."GenerationAccountId"
  -- Check if the is "primary account" bit flag is set.
  -- Special exception for fit account 422, as it does not have a primary account
  JOIN fit.CustomerAccount AS ca
    ON ca."FitAccountId" = ga."FitAccountId" AND ((ca."CustomerRoleValue" & 1) > 0 OR ca."FitAccountId" = 422)
  LEFT JOIN fit.Customer AS c
    ON c."CustomerId" = ca."CustomerId"
ON CONFLICT
  (source_system_id) WHERE source_system_id IS NOT NULL
  DO UPDATE
    SET
      address_id = EXCLUDED.address_id,
      name = EXCLUDED.name,
      type = EXCLUDED.type,
      technology_type = EXCLUDED.technology_type,
      property_type = EXCLUDED.property_type,
      export_type = EXCLUDED.export_type,
      commissioned_on = EXCLUDED.commissioned_on,
      decommissioned_on = EXCLUDED.decommissioned_on,
      eligibility_start_on = EXCLUDED.eligibility_start_on,
      eligibility_end_on = EXCLUDED.eligibility_end_on,
      installed_on = EXCLUDED.installed_on,
      verified_on = EXCLUDED.verified_on,
      reverified_on = EXCLUDED.reverified_on,
      inspected_on = EXCLUDED.inspected_on,
      mcs_reference = EXCLUDED.mcs_reference,
      tic_reference = EXCLUDED.tic_reference,
      dnc_reference = EXCLUDED.dnc_reference,
      roofit_reference = EXCLUDED.roofit_reference,
      name_of_grant = EXCLUDED.name_of_grant,
      value_of_grant = EXCLUDED.value_of_grant,
      date_grant_repaid = EXCLUDED.date_grant_repaid,
      epc_rate = EXCLUDED.epc_rate,
      epc_date = EXCLUDED.epc_date,
      epc_number = EXCLUDED.epc_number,
      has_battery_storage = EXCLUDED.has_battery_storage,
      battery_installation_date_on = EXCLUDED.battery_installation_date_on,
      export_mpan = EXCLUDED.export_mpan,
      supply_mpan = EXCLUDED.supply_mpan,
      switched_from = EXCLUDED.switched_from,
      switched_to = EXCLUDED.switched_to,
      switched_on = EXCLUDED.switched_on,
      legacy_fit_db_id = EXCLUDED.legacy_fit_db_id,
      created_at = EXCLUDED.created_at,
      updated_at = EXCLUDED.updated_at
