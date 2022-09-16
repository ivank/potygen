 INSERT INTO meter_registers (
    id,
    customer_label,
    industry_label,
    smt_rule_set,
    smt_rule_start_on,
    register_multiplier,
    meter_id,
    index_position
  )
  VALUES
    (
      $id,
      $customerLabel,
      $industryLabel,
      CONCAT_WS('-', COALESCE($smtRuleStart, '00'), COALESCE($smtRuleEnd, '24')),
      $smtRuleStartOn,
      $multiplier,
      $meterId!,
      $indexPosition!
    )
  ON CONFLICT (id)
    DO UPDATE
      SET
        customer_label = EXCLUDED.customer_label,
        industry_label = EXCLUDED.industry_label,
        smt_rule_set = EXCLUDED.smt_rule_set,
        smt_rule_start_on = EXCLUDED.smt_rule_start_on,
        register_multiplier = EXCLUDED.register_multiplier
  -- meter_id = EXCLUDED.meter_id,
  -- index_position = EXCLUDED.index_position,
  RETURNING
    id
