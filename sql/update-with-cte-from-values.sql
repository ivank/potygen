UPDATE meter_registers AS r
SET
    customer_label = r2.customer_label,
    industry_label = r2.industry_label,
    smt_rule_set = CONCAT_WS('-', r2.smt_rule_start, r2.smt_rule_end),
    smt_rule_start_on = r2.smt_rule_start_on::timestamp,
    register_multiplier = r2.register_multiplier::int
FROM (
    VALUES
      $$registers(
          "id",
          "customerLabel",
          "industryLabel",
          "smtRuleStart",
          "smtRuleEnd",
          "smtRuleStartOn",
          "multiplier",
          "meterId",
          "indexPosition"
      )
) AS r2(
    id,
    customer_label,
    industry_label,
    smt_rule_start,
    smt_rule_end,
    smt_rule_start_on,
    register_multiplier,
    meter_id,
    index_position
)
