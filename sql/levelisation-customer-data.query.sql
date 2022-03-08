SELECT
  json_build_object('start', levelisations.start_on, 'end', levelisations.end_on) AS "interval",
  levelisations.quarter AS "levelisationQuarter",
  accounts.id AS "accountId",
  (
    SELECT
      json_build_object(
        'title', contacts.title,
        'firstName', contacts.first_name,
        'lastName', contacts.last_name,
        'email', contacts.email,
        'address',
        json_build_object(
          'city', addresses.city,
          'postcode', addresses.postcode,
          'line1', addresses.address_line_1,
          'line2', addresses.address_line_2,
          'line3', addresses.address_line_3
        )
      )
    FROM
      contacts
      JOIN addresses
        ON addresses.id = contacts.address_id
    WHERE
      contacts.id = accounts.primary_contact_id
  ) AS "contact",
  (
    SELECT
      json_build_object(
        'installationId', installations.id,
        'technologyType', installations.technology_type,
        'meters',
        (
          ARRAY(
            SELECT
              json_build_object(
                'id', installation_meters.id,
                'startOn', installation_meters.start_on,
                'endOn', installation_meters.end_on,
                'type', installation_meters.meter_type,
                'reads',
                (
                  ARRAY(
                    SELECT
                      json_build_object(
                        'value', active_reads.value,
                        'dateOn', active_reads.date_on,
                        'type', active_reads.type,
                        'id', active_reads.id
                      )
                    FROM active_reads
                    WHERE
                      active_reads.type <> 'Meter Verification' AND active_reads.meter_id = installation_meters.meter_id
                    ORDER BY
                      active_reads.date_on DESC
                  )
                )
              )
            FROM installation_meters
            WHERE
              installation_meters.installation_id = installations.id
          )
        ),
        'contracts',
        (
          ARRAY(
            SELECT
              json_build_object(
                'schemeType', contracts.scheme_type,
                'schemeAccountReference', contracts.scheme_account_reference,
                'capacity', contracts.capacity,
                'generationTariffId', contracts.generation_tariff_id,
                'exportTariffId', contracts.export_tariff_id,
                'startOn', contracts.start_on,
                'endOn', contracts.end_on,
                'exportType', contracts.export_type,
                'exportPercentageSplit', contracts.export_percentage_split,
                'generationPercentageSplit', contracts.generation_percentage_split,
                'generationRates',
                (
                  ARRAY(
                    SELECT
                      json_build_object(
                        'id', generation_tariff_rates.id,
                        'startOn', generation_tariff_rates.start_date_on,
                        'endOn', COALESCE(generation_tariff_rates.end_date_on, '9998-12-31'::date),
                        'rate', generation_tariff_rates.rate
                      )
                    FROM tariff_rates AS generation_tariff_rates
                    WHERE
                      generation_tariff_rates.tariff_id = contracts.generation_tariff_id
                  )
                ),
                'exportRates',
                (
                  ARRAY(
                    SELECT
                      json_build_object(
                        'id', export_tariff_rates.id,
                        'startOn', export_tariff_rates.start_date_on,
                        'endOn', COALESCE(export_tariff_rates.end_date_on, '9998-12-31'::date),
                        'rate', export_tariff_rates.rate
                      )
                    FROM tariff_rates AS export_tariff_rates
                    WHERE
                      export_tariff_rates.tariff_id = contracts.export_tariff_id
                  )
                )
              )
            FROM contracts
            WHERE
              contracts.installation_id = installations.id
          )
        )
      )
    FROM installations
    WHERE
      account_levelisations.installation_id = installations.id
  ) AS "installation"
FROM
  account_levelisations
  JOIN levelisations
    ON levelisations.id = account_levelisations.levelisation_id
  JOIN accounts
    ON accounts.id = account_levelisations.account_id
WHERE
  account_levelisations.id = $accountLevelisationId!
