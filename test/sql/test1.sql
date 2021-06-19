SELECT
  accounts.id as "id",
  accounts.state as "state",
  accounts.note as "note",
  statements.loss_date as "lossDate",
  accounts.reviewer_email as "reviewerEmail",
  accounts.unable_to_resolve_reason as "unableToResolveReason",
  jsonb_build_object(
    'id', statements.id,
    'state', statements.state,
    'errors', statements.statement_errors,
    'ref', statements.statement_ref
  ) as "statement"
FROM accounts
JOIN statements ON statements.id = accounts.statement_id
WHERE
  CASE
    WHEN :worklist = 'TOLERANCE'
    THEN statements.statement_errors->>'code' = ANY(${[
      StatementErrorCode.EndReadingToleranceElec,
      StatementErrorCode.EndReadingToleranceGas,
      StatementErrorCode.StartReadingToleranceElec,
      StatementErrorCode.StartReadingToleranceGas,
    ]})

    WHEN :worklist = 'HIGH_BALANCE'
    THEN statements.state = 'PENDING_APPROVAL'

    WHEN :worklist = 'READ_AMENDMENTS'
    THEN statements.statement_errors->>'code' = ${StatementErrorCode.NegativeConsumption}

    WHEN :worklist = 'TARIFF_ISSUES'
    THEN
      statements.statement_errors @> ${toErrors([StatementErrorCode.ContractMeterTypeMismatch])}::jsonb
      OR statements.statement_errors @> ${toErrors([
        StatementErrorCode.ContractMeterTypeMismatch,
        StatementErrorCode.MissingChargesGas,
      ])}::jsonb
      OR statements.statement_errors @> ${toErrors([
        StatementErrorCode.FACRateMissing,
        StatementErrorCode.TariffNameMissing,
        StatementErrorCode.MissingChargesElec,
      ])}::jsonb
      OR statements.statement_errors @> ${toErrors([
        StatementErrorCode.FACRateMissing,
        StatementErrorCode.TariffNameMissing,
        StatementErrorCode.MissingChargesGas,
      ])}::jsonb
      OR statements.statement_errors @> ${toErrors([
        StatementErrorCode.ContractMeterTypeMismatch,
        StatementErrorCode.MissingChargesGas,
      ])}::jsonb
      OR statements.statement_errors @> ${toErrors([
        StatementErrorCode.ContractMeterTypeMismatch,
        StatementErrorCode.MissingChargesElec,
      ])}::jsonb

    WHEN :worklist = 'VALIDATIONS'
    THEN jsonb_array_length(statements.statement_errors) > 0
  END
  AND CASE
    WHEN :lossDate IS NOT NULL
    THEN loss_date = :lossDate::DATE
    ELSE TRUE
  END
  AND CASE
    WHEN :statementErrors IS NOT NULL
    THEN statements.statement_errors @> ${toErrors(statementErrors)}::jsonb
    ELSE TRUE
  END
  AND CASE
    WHEN ${accountStates !== undefined}::bool
    THEN accounts.state = ANY(${accountStates}::account_state[])
    ELSE TRUE
  END
  AND CASE
    WHEN ${statementStates !== undefined}::bool
    THEN statements.state = ANY(${statementStates}::statement_state[])
    ELSE TRUE
  END
  AND CASE
    WHEN ${reviewerEmails !== undefined}::bool
    THEN accounts.reviewer_email = ANY(${reviewerEmails})
    ELSE TRUE
  END
