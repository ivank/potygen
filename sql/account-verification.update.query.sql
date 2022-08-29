 WITH
    items (account_number, verified_on) AS
    (
      VALUES
        $$items(
          GH_account_id,
          "MV date"
        )
    ),
    accounts_back_to_live AS
    (
      UPDATE accounts
      SET
        state = 'Live',
        on_hold_reasons = NULL,
        end_on = NULL,
        updated_at = $currentDate!
      FROM items
      WHERE
        items.account_number = accounts.account_number
    )
  UPDATE meters
  SET
    verified_on = items.verified_on::date,
    updated_at = $currentDate!
  FROM installation_meters, contracts, accounts, items
  WHERE
    installation_meters.meter_id = meters.id AND contracts.installation_id = installation_meters.installation_id
    AND accounts.id = contracts.account_id
    AND accounts.account_number = items.account_number
