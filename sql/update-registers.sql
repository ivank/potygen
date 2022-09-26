 WITH registers_payload
  (
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
  AS
  (
    VALUES
      $$registers(
        "id"::int,
        "customerLabel",
        "industryLabel",
        "smtRuleStart"::varchar(10),
        "smtRuleEnd"::text,
        "smtRuleStartOn"::date,
        "multiplier",
        "meterId",
        "indexPosition"::int
      )
  ),
  update_meter_registers AS
  (
    UPDATE meter_registers AS r
    SET
      customer_label = r2.customer_label,
      industry_label = r2.industry_label,
      smt_rule_set = CONCAT_WS('-', r2.smt_rule_start, r2.smt_rule_end),
      smt_rule_start_on = r2.smt_rule_start_on::timestamp,
      register_multiplier = r2.register_multiplier::int
    FROM registers_payload AS r2
    -- Potygen doesn't allow to input the values directly using
    -- FROM (VALUES $$registers(id, meterId)) AS r2(id, meter_id)
    WHERE
      r2.id::int = r.id AND r2.meter_id::int = r.meter_id AND r2.index_position::int = r.index_position
  )
  SELECT r2.index_position FROM registers_payload AS r2
