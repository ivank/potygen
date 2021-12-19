export interface StartParams {}
export interface StartResult {}
export interface StartQuery {
  params: StartParams;
  result: StartResult;
}
export interface InitParams {}
export interface InitResult {}
export interface InitQuery {
  params: InitParams;
  result: InitResult;
}
export interface RetrieveParams {}
export interface RetrieveResult {
  id: number;
  not_null: number;
  default_not_null: number;
  bigint_col?: string;
  bigserial_col: string;
  bit_col?: string;
  bit_varying_col?: string;
  boolean_col?: boolean;
  box_col?: string;
  bytea_col: Buffer;
  character_col?: string;
  character_varying_col?: string;
  cidr_col?: string;
  circle_col: {
    x: number;
    y: number;
    radius: number;
  };
  date_col?: Date;
  double_col?: string;
  inet_col?: string;
  integer_col?: number;
  interval_col: {
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
  };
  json_col?: unknown;
  jsonb_col?: unknown;
  line_col?: string;
  lseg_col?: string;
  macaddr_col?: string;
  money_col?: string;
  numeric_col?: string;
  path_col?: string;
  pg_lsn_col?: string;
  point_col: {
    x: number;
    y: number;
  };
  polygon_col?: string;
  real_col?: number;
  smallint_col?: number;
  smallserial_col: number;
  serial_col: number;
  text_col?: string;
  time_col?: string;
  time_with_time_zone_col?: Date;
  timestamp_col?: Date;
  timestamp_with_time_zone_col?: Date;
  tsquery_col?: string;
  tsvector_col?: string;
  txid_snapshot_col?: string;
  uuid_col?: string;
  xml_col?: string;
}
export interface RetrieveQuery {
  params: RetrieveParams;
  result: RetrieveResult;
}
export interface EndParams {}
export interface EndResult {}
export interface EndQuery {
  params: EndParams;
  result: EndResult;
}
