INSERT INTO account_levelisations (account_id, installation_id, levelisation_id, state)
SELECT accounts.id AS account_id, installations.id AS installation_id, $levelisationId AS levelisation_id, 'Pending'
FROM
  accounts
  JOIN contracts
    ON contracts.account_id = accounts.id
  LEFT JOIN installations
    ON contracts.installation_id = installations.id
WHERE
  (accounts.end_on IS NULL OR accounts.end_on >= $start)
  AND contracts.export_type = ANY(ARRAY['Metered Export', 'Deemed']::installation_export_type[])
GROUP BY
  accounts.id,
  installations.id
ON CONFLICT (account_id, installation_id, levelisation_id) DO UPDATE SET state = EXCLUDED.state
RETURNING
  id
