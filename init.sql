CREATE TYPE inventory_item AS (
    name            text,
    supplier_id     integer,
    price           numeric
);
COMMENT ON TYPE inventory_item IS 'Composite inventory data';

CREATE TYPE account_state as ENUM('Active', 'Pending', 'Dispute', 'Closed');
COMMENT ON TYPE account_state IS 'Lifecycle of account';

CREATE TABLE all_types (
  id SERIAL PRIMARY KEY,
  not_null INT NOT NULL,
  default_not_null INT NOT NULL DEFAULT 10,
  bigint_col bigint,
  bigserial_col bigserial,
  bit_col bit,
  bit_varying_col bit varying,
  boolean_col boolean,
  box_col box,
  bytea_col bytea,
  character_col character,
  character_varying_col character varying,
  cidr_col cidr,
  circle_col circle,
  date_col date,
  double_col double precision,
  inet_col inet,
  integer_col integer,
  interval_col interval,
  json_col json,
  jsonb_col jsonb,
  line_col line,
  lseg_col lseg,
  macaddr_col macaddr,
  money_col money,
  numeric_col numeric,
  path_col path,
  pg_lsn_col pg_lsn,
  point_col point,
  polygon_col polygon,
  real_col real,
  smallint_col smallint,
  smallserial_col smallserial,
  serial_col serial,
  text_col text,
  time_col time,
  time_with_time_zone_col time with time zone,
  timestamp_col timestamp,
  timestamp_with_time_zone_col timestamp with time zone,
  tsquery_col tsquery,
  tsvector_col tsvector,
  txid_snapshot_col txid_snapshot,
  uuid_col uuid,
  xml_col xml,
  item inventory_item,
  state account_state
);

COMMENT ON TABLE all_types IS 'All the postgres types';
COMMENT ON COLUMN all_types.not_null IS 'This column should never be null';
COMMENT ON COLUMN all_types.state IS '
  This column is an enum.
  It also contains several lines:
    - line1
    - line2
';

CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    city character varying(50),
    country character varying(50) NOT NULL,
    postcode character varying(10) NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    county character varying,
    address_line_1 character varying,
    address_line_2 character varying,
    address_line_3 character varying,
    source_system_id integer
);

CREATE TYPE contact_titles as ENUM('Mrs', 'Miss', 'Dr', 'Ms', 'Mr');

CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    address_id integer NOT NULL REFERENCES addresses(id),
    title contact_titles,
    first_name character varying(35) NOT NULL,
    last_name character varying(35) NOT NULL,
    email character varying(100),
    phone character varying(12),
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    source_system_id integer,
    CONSTRAINT address_name_surname_pk UNIQUE (address_id, first_name, last_name)
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_reference character varying(15) NOT NULL,
    orion_account_number character varying,
    primary_contact_id integer REFERENCES contacts(id),
    secondary_contact_id integer REFERENCES contacts(id),
    tertiary_contact_id integer REFERENCES contacts(id),
    company_reg_number character varying(8),
    company_name character varying(50),
    company_vat_number character varying(12),
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    billing_address_id integer REFERENCES addresses(id),
    source_system_id integer,
    generator_id character varying(20) DEFAULT NULL::character varying
);

CREATE TYPE account_payment_plans as ENUM('BACs', 'Cheque', 'Internal Transfer');

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    customer_id integer NOT NULL REFERENCES customers(id),
    state account_state NOT NULL DEFAULT 'Pending'::account_state,
    beneficiary_name character varying,
    beneficiary_sort_code character varying,
    beneficiary_account_number character varying,
    payment_plan account_payment_plans,
    payment_suspended boolean DEFAULT false,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    source_system_id integer,
    start_on date,
    end_on date
);

CREATE TYPE tariff_types as ENUM('Export', 'Generation', 'SEG');

CREATE TABLE tariffs (
    id SERIAL PRIMARY KEY,
    code character varying NOT NULL UNIQUE,
    type tariff_types NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    source_system_id integer
);

CREATE TABLE tariff_rates (
    id SERIAL PRIMARY KEY,
    tariff_id integer NOT NULL REFERENCES tariffs(id),
    rate numeric NOT NULL,
    start_date_on date NOT NULL,
    end_date_on date,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    source_system_id integer
);

CREATE TYPE installation_types as ENUM(
  'Retrofit',
  'New build',
  'Standalone',
  'Extension of an existing FiT-accredited installation',
  'None'
);

CREATE TYPE installation_technology_types as ENUM(
  'PV', -- Solar PV
  'H', -- Hydro
  'W', -- Wind
  'AD', -- Anaerobic digestion
  'CHP' -- MicroCHP
);

CREATE TYPE installation_property_type as ENUM(
  'Domestic',
  'Commercial',
  'Farm',
  'Industrial',
  'Not for profit',
  'School/Education',
  'Other'
);

CREATE TYPE installation_export_type as ENUM(
  'Deemed',
  'Metered Export',
  'Off Grid',
  'PPA'
);

CREATE TABLE installations (
    id SERIAL PRIMARY KEY,
    name character varying,
    type installation_types NOT NULL,
    technology_type installation_technology_types NOT NULL,
    property_type installation_property_type NOT NULL,
    export_type installation_export_type,
    commissioned_on date,
    decommissioned_on date,
    installed_on date NOT NULL,
    verified_on date,
    reverified_on date,
    inspected_on date,
    mcs_reference character varying NOT NULL,
    tic_reference numeric(10,3) NOT NULL,
    dnc_reference numeric(10,3) NOT NULL,
    roofit_reference character varying(25),
    has_battery_storage boolean,
    battery_installation_date_on date,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    export_mpan character varying,
    source_system_id integer,
    name_of_grant character varying,
    value_of_grant numeric(10,2),
    eligibility_start_on date,
    eligibility_end_on date,
    date_grant_repaid date,
    epc_rate character varying(1),
    epc_date date,
    epc_number integer,
    legacy_fit_db_id character varying,
    supply_mpan character varying,
    switched_from character varying,
    switched_to character varying,
    switched_on date,
    address_id integer NOT NULL REFERENCES addresses(id)
);

CREATE TYPE contract_scheme_types as ENUM('FIT', 'SEG');

CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    scheme_type contract_scheme_types NOT NULL,
    scheme_account_reference character varying NOT NULL,
    confirmation_on date,
    terms_and_conditions_agreed boolean NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    installation_id integer NOT NULL REFERENCES installations(id),
    generation_tariff_id integer REFERENCES tariffs(id),
    export_tariff_id integer REFERENCES tariffs(id),
    source_system_id integer,
    export_percentage_split numeric(5,2),
    generation_percentage_split numeric(5,2),
    contact_id integer NOT NULL REFERENCES contacts(id),
    account_id integer NOT NULL REFERENCES accounts(id),
    capacity numeric(10,2) NOT NULL,
    start_on date NOT NULL,
    end_on date,
    export_type installation_export_type
);

CREATE TABLE meters (
    id SERIAL PRIMARY KEY,
    mpan character varying NOT NULL,
    shared boolean NOT NULL,
    serial_number character varying NOT NULL,
    make character varying NOT NULL,
    model character varying NOT NULL,
    hh_metered boolean NOT NULL,
    gsp character varying,
    distribution_region character varying,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    source_system_id integer
);

CREATE TYPE meter_reads_types as ENUM('Opening', 'Closing', 'Quarterly', 'Meter Verification');

CREATE TABLE meter_reads (
    id SERIAL PRIMARY KEY,
    meter_id integer NOT NULL REFERENCES meters(id),
    date_on date NOT NULL,
    value integer NOT NULL,
    type meter_reads_types NOT NULL,
    reason character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    source_system_id integer,
    checked boolean NOT NULL DEFAULT false,
    deleted_at date,
    submitted_at date,
    history jsonb NOT NULL DEFAULT '[]'::jsonb,
    overwritten_at timestamp without time zone
);
COMMENT ON COLUMN meter_reads.source_system_id IS 'sql-fit: MeterReading.MeterReadingId';

CREATE TYPE meter_types as ENUM('Export', 'Generation');

CREATE TABLE installation_meters (
    id SERIAL PRIMARY KEY,
    meter_type meter_types NOT NULL,
    meter_id integer NOT NULL REFERENCES meters(id),
    installation_id integer NOT NULL REFERENCES installations(id),
    start_on date,
    end_on date,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    source_system_id integer
);

CREATE TABLE levelisations (
    id SERIAL PRIMARY KEY,
    quarter character varying(6) NOT NULL,
    start_on date NOT NULL,
    end_on date NOT NULL,
    is_accepted boolean NOT NULL DEFAULT false,
    is_bacs_payments_sent boolean NOT NULL DEFAULT false,
    is_cheque_payments_sent boolean NOT NULL DEFAULT false
);

CREATE TYPE account_levelisation_state as ENUM('Pending', 'Done');

CREATE TABLE account_levelisations (
    id SERIAL PRIMARY KEY,
    account_id integer NOT NULL REFERENCES accounts(id),
    installation_id integer NOT NULL REFERENCES installations(id),
    levelisation_id integer NOT NULL REFERENCES levelisations(id),
    is_accepted boolean NOT NULL DEFAULT true,
    state account_levelisation_state NOT NULL DEFAULT 'Pending'::account_levelisation_state,
    generation_start_read_on date,
    generation_start_read_value numeric(10,2),
    generation_end_read_on date,
    generation_end_read_value numeric(10,2),
    generation_percentage_split numeric(5,2),
    export_start_read_on date,
    export_start_read_value numeric(10,2),
    export_end_read_on date,
    export_end_read_value numeric(10,2),
    export_percentage_split numeric(5,2),
    generation_payment numeric(10,0),
    export_payment numeric(10,0),
    generation_periods jsonb,
    export_periods jsonb,
    total_payment numeric(10,0),
    vat_payment numeric(10,0),
    generation_energy numeric(10,2),
    export_energy numeric(10,2),
    export_type installation_export_type,
    technology_type installation_technology_types,
    is_bacs_payments_sent boolean,
    is_cheque_payments_sent boolean,
    resolved_postlev_id integer REFERENCES account_levelisations(id)
);

CREATE TYPE issue_state as ENUM('Open', 'In Progress', 'Closed', 'Blocked', 'Resolved', 'Unresolvable');
CREATE TYPE issue_type as ENUM('Read Tolerance', 'Account Levelisation', 'Installation','Payment', 'Meter');
CREATE TYPE issue_reference_type as ENUM('Read', 'Account Levelisation', 'Account', 'Installation', 'Comm', 'Payment', 'Meter');

CREATE TABLE issues (
    id SERIAL,
    description character varying NOT NULL,
    assignee character varying,
    due_date timestamp without time zone,
    account_id integer REFERENCES accounts(id),
    account_identifier character varying,
    comments jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    type issue_type,
    state issue_state NOT NULL DEFAULT 'Open'::issue_state,
    reference_type issue_reference_type,
    reference_id integer,
    payload jsonb,
    CONSTRAINT issues_pkey PRIMARY KEY (reference_id, reference_type, type)
);

CREATE TYPE payments_type as ENUM('Levelisation');

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    account_id integer NOT NULL REFERENCES accounts(id),
    sent_at timestamp without time zone,
    amount numeric NOT NULL,
    type payments_type NOT NULL,
    gen_meter_id integer NOT NULL,
    gen_start_meter_read_date date,
    gen_start_meter_read_id integer,
    gen_start_meter_read_value integer,
    gen_end_meter_read_date date,
    gen_end_meter_read_id integer,
    gen_end_meter_read_value integer,
    gen_total_output integer,
    export_meter_id integer,
    export_start_meter_read_date date,
    export_start_meter_read_id integer,
    export_start_meter_read_value integer,
    export_end_meter_read_date date,
    export_end_meter_read_id integer,
    export_end_meter_read_value integer,
    export_total_output integer,
    deemed_total_output numeric,
    periods jsonb,
    is_company boolean DEFAULT false,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    fit_reference character varying NOT NULL,
    comment character varying,
    levelisation_reference character varying(50)
);

CREATE VIEW active_reads AS
  SELECT
    meter_reads.id,
    meter_reads.meter_id,
    meter_reads.date_on,
    meter_reads.value,
    meter_reads.type,
    meter_reads.reason,
    meter_reads.created_at,
    meter_reads.updated_at,
    meter_reads.source_system_id,
    meter_reads.checked,
    meter_reads.deleted_at,
    meter_reads.submitted_at,
    meter_reads.history,
    meter_reads.overwritten_at
  FROM meter_reads
  WHERE
    NOT EXISTS (
      SELECT issues.id
      FROM issues
      WHERE
        issues.reference_type = 'Read'::issue_reference_type AND issues.reference_id = meter_reads.id
        AND (issues.state IS NULL OR issues.state = 'Resolved'::issue_state)
    )
    AND meter_reads.deleted_at IS NULL
    AND meter_reads.checked IS TRUE
    AND meter_reads.overwritten_at IS NULL;

CREATE TYPE public.process_item_status AS ENUM (
    'Pending',
    'Done',
    'Error'
);

CREATE TABLE public.process_items (
    id SERIAL PRIMARY KEY,
    process_id integer NOT NULL,
    account_id integer NOT NULL,
    idempotency_key character varying,
    data jsonb NOT NULL,
    status public.process_item_status DEFAULT 'Pending'::public.process_item_status NOT NULL,
    error character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);

CREATE SCHEMA fit;

CREATE TABLE fit.Address (
    "AddressId" SERIAL,
    "AddressLine1" varchar(50),
    "AddressLine2" varchar(50),
    "AddressLine3" varchar(50),
    "PostCode" char(8),
    "City" varchar(50),
    "County" varchar(50),
    "Country" varchar(50),
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    PRIMARY KEY ("AddressId")
);

CREATE TABLE fit.AddressType (
    "AddressTypeId" SERIAL,
    "AddressTypeTitle" varchar(50),
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    PRIMARY KEY ("AddressTypeId")
);

CREATE TABLE fit.AuditCSA (
    "AuditCSAId" SERIAL,
    "User" varchar(255),
    "Action" varchar(64),
    "Details" varchar(2000),
    "ActionDate" timestamp(3),
    "FiTAccountId" int,
    PRIMARY KEY ("AuditCSAId")
);

CREATE TABLE fit.Customer (
    "CustomerId" SERIAL,
    "CustomerReference" varchar(15),
    "CustomerType" char(1),
    "Title" varchar(15),
    "FirstName" varchar(35),
    "MiddleName" varchar(35),
    "LastName" varchar(35),
    "CompanyName" varchar(50),
    "CompanyRegNo" char(8),
    "CompanyVATNo" char(12),
    "EmailAddress" varchar(255),
    "TelephoneNo" char(12),
    "IsSupplyCustomer" boolean,
    "SupplyMPAN" bigint,
    "GeneratorId" varchar(25),
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    "PaymentType" varchar(25),
    PRIMARY KEY ("CustomerId")
);

CREATE TABLE fit.FiTAccount (
    "FiTAccountId" SERIAL,
    "FitAccountReference" varchar(15),
    "IsAccountInDispute" boolean,
    "IsActive" boolean DEFAULT TRUE,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    "DateDisputeStart" timestamp(3),
    "DateDisputeEnd" timestamp(3),
    PRIMARY KEY ("FiTAccountId")
);

CREATE TABLE fit.FiTAccountSequence (
    "FiTAccountSequenceId" bigSERIAL,
    "DateGenerated" timestamp(3),
    PRIMARY KEY ("FiTAccountSequenceId")
);

CREATE TABLE fit.GenerationAccount (
    "GenerationAccountId" SERIAL,
    "CheckListValue" int,
    "FitAccountId" int,
    "IsActive" boolean DEFAULT TRUE,
    "PaymentSuspended" boolean,
    "DatePaymentSuspended" date,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    CONSTRAINT FK_GenerationAccountId_FitAccount FOREIGN KEY ("FitAccountId") REFERENCES fit.FiTAccount("FiTAccountId"),
    PRIMARY KEY ("GenerationAccountId")
);

CREATE TABLE fit.BankAccount (
    "BankAccountId" SERIAL,
    "BankAccountName" varchar(50),
    "BankAccountNo" char(8),
    "BankSortCode" char(8),
    "GenerationAccountId" int,
    "BankName" varchar(50),
    "CustomerId" int,
    "BillingAddressId" int,
    "IsActive" boolean DEFAULT TRUE,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    CONSTRAINT FK_BankAccount_BillingAddress FOREIGN KEY ("BillingAddressId") REFERENCES fit.Address("AddressId"),
    CONSTRAINT FK_BankAccount_Customer FOREIGN KEY ("CustomerId") REFERENCES fit.Customer("CustomerId"),
    CONSTRAINT FK_BankAccount_GenerationAccount FOREIGN KEY ("GenerationAccountId") REFERENCES fit.GenerationAccount("GenerationAccountId"),
    PRIMARY KEY ("BankAccountId")
);

CREATE TABLE fit.BankAccountAudit (
    "BankAccountAuditId" SERIAL,
    "BankAccountId" int,
    "BankAccountName" varchar(50),
    "BankAccountNo" char(8),
    "BankSortCode" char(8),
    "GenerationAccountId" int,
    "BankName" varchar(50),
    "CustomerId" int,
    "BillingAddressId" int,
    "IsActive" boolean,
    "DateInserted" timestamp(3),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    "WhoUpdatedHostName" varchar(255),
    "ActionDateTime" timestamp(3) DEFAULT (now()),
    PRIMARY KEY ("BankAccountAuditId")
);

CREATE TABLE fit.Checklist (
    "ChecklistId" SERIAL,
    "ChecklistTitle" varchar(100),
    "ChecklistDesc" varchar(250),
    "ChecklistValue" int,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    PRIMARY KEY ("ChecklistId")
);

CREATE TABLE fit.Configuration (
    "ConfigurationId" SERIAL,
    "ConfigurationTitle" varchar(50),
    "ConfigurationValue" varchar(255),
    "ConfigurationDesc" varchar(255),
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    PRIMARY KEY ("ConfigurationId")
);


CREATE TABLE fit.CustomerAccount (
    "CustomerAccountId" SERIAL,
    "CustomerId" int,
    "CustomerRoleValue" int,
    "FitAccountId" int,
    "IsActive" boolean DEFAULT TRUE,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    CONSTRAINT FK_CustomerAccount_FitAccount FOREIGN KEY ("FitAccountId") REFERENCES fit.FiTAccount("FiTAccountId"),
    CONSTRAINT FK_CustomerAccount_Customer FOREIGN KEY ("CustomerId") REFERENCES fit.Customer("CustomerId"),
    PRIMARY KEY ("CustomerAccountId")
);

CREATE TABLE fit.CustomerAddress (
    "CustomerAddressId" SERIAL,
    "CustomerId" int,
    "AddressId" int,
    "AddressTypeId" int,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    CONSTRAINT FK_CustomerAddress_Address FOREIGN KEY ("AddressId") REFERENCES fit.Address("AddressId"),
    CONSTRAINT FK_CustomerAddress_Customer FOREIGN KEY ("CustomerId") REFERENCES fit.Customer("CustomerId"),
    CONSTRAINT FK_CustomerAddress_AddressType FOREIGN KEY ("AddressTypeId") REFERENCES fit.AddressType("AddressTypeId"),
    PRIMARY KEY ("CustomerAddressId")
);

CREATE TABLE fit.CustomerRole (
    "CustomerRoleId" SERIAL,
    "CustomerRoleTitle" varchar(50),
    "CustomerRoleValue" int,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    PRIMARY KEY ("CustomerRoleId")
);

CREATE TABLE fit.CustomerSequence (
    "CustomerSequenceId" bigSERIAL,
    "DateGenerated" timestamp(3),
    PRIMARY KEY ("CustomerSequenceId")
);

CREATE TABLE fit.DocumentType (
    "DocumentTypeId" SERIAL,
    "DocumentTypeTitle" varchar(50),
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    PRIMARY KEY ("DocumentTypeId")
);

CREATE TABLE fit.Document (
    "DocumentId" SERIAL,
    "DocumentTypeId" int,
    "Location" varchar(255),
    "GenerationAccountId" int,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    CONSTRAINT FK_Document_DocumentType FOREIGN KEY ("DocumentTypeId") REFERENCES fit.DocumentType("DocumentTypeId"),
    CONSTRAINT FK_Document_GenerationAccountId FOREIGN KEY ("GenerationAccountId") REFERENCES fit.GenerationAccount("GenerationAccountId"),
    PRIMARY KEY ("DocumentId")
);

CREATE TABLE fit.FailedMeterReading (
    "FailedReadId" SERIAL,
    "FiTId" varchar(15),
    "ErrorMessage" varchar(2000),
    "DateOfReading" timestamp(3),
    "GenerationReading" int,
    "ExportReading" int,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "WhoInserted" varchar(255),
    "Resolved" boolean DEFAULT FALSE,
    PRIMARY KEY ("FailedReadId")
);

CREATE TABLE fit.FailedValidationImport (
    "FailedValidationImportId" SERIAL,
    "FailureType" varchar(50),
    "FailureMessage" varchar(150),
    "DateOfFailure" date,
    "SupplyMPAN" bigint,
    "MeterSerial" varchar(50),
    "ReadValue" int,
    "ReadDate" date,
    "Filename" varchar(255),
    "OriginalData" varchar(800),
    PRIMARY KEY ("FailedValidationImportId")
);

CREATE TABLE fit.GeneratorTechnologyType (
    "GeneratorTechnologyTypeId" SERIAL,
    "GeneratorTechnologyTypeTitle" varchar(50),
    "GeneratorTechnologyTypeRef" varchar(5),
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    PRIMARY KEY ("GeneratorTechnologyTypeId")
);

CREATE TABLE fit.GenTrackAccount (
    "GenTrackAccountId" SERIAL,
    "GenTrackAccountNo" int,
    "CustomerId" int,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    CONSTRAINT FK_GenTrackAccount_Customer FOREIGN KEY ("CustomerId") REFERENCES fit.Customer("CustomerId"),
    PRIMARY KEY ("GenTrackAccountId")
);

CREATE TABLE fit.InstallationType (
    "InstallationTypeId" SERIAL,
    "InstallationTypeTitle" varchar(100),
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    PRIMARY KEY ("InstallationTypeId")
);

CREATE TABLE fit.PropertyType (
    "PropertyTypeId" SERIAL,
    "PropertyTypeTitle" varchar(50),
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    PRIMARY KEY ("PropertyTypeId")
);

CREATE TABLE fit.Installation (
    "InstallationId" SERIAL,
    "InstallationReference" varchar(25),
    "GeneratorTechnologyTypeId" int,
    "CFRFiTId" varchar(15),
    "InstallationName" varchar(35),
    "InstalledCapacity" decimal(10,2),
    "DateInstalled" date,
    "PropertyTypeId" int,
    "AddressId" int,
    "InstallationTypeId" int,
    "MCSInstallerCertificateNo" char(14),
    "ROOFITNo" varchar(25),
    "NameOfGrant" varchar(35),
    "ValueOfGrant" decimal(10,2),
    "DateGrantRepaid" date,
    "CFRExtensionId" varchar(15),
    "EligibleForPayments" boolean,
    "EligibilityDate" date,
    "EligibilityEndDate" date,
    "ConfirmationDate" date,
    "TariffDate" date,
    "CapacityChanges" boolean,
    "DateOfgemNotifiedOfCapacityChanges" date,
    "DecommisionedDate" date,
    "PVMultiInstalltion" boolean,
    "EPCRate" char(1),
    "ExportType" varchar(25),
    "IsActive" boolean DEFAULT TRUE,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    "SEGId" varchar(15),
    CONSTRAINT FK_Installation_AddressId FOREIGN KEY ("AddressId") REFERENCES fit.Address("AddressId"),
    CONSTRAINT FK_Installation_InstallationType FOREIGN KEY ("InstallationTypeId") REFERENCES fit.InstallationType("InstallationTypeId"),
    CONSTRAINT FK_Installation_GeneratorTechnologyType FOREIGN KEY ("GeneratorTechnologyTypeId") REFERENCES fit.GeneratorTechnologyType("GeneratorTechnologyTypeId"),
    CONSTRAINT FK_Installation_PropertyTypeId FOREIGN KEY ("PropertyTypeId") REFERENCES fit.PropertyType("PropertyTypeId"),
    PRIMARY KEY ("InstallationId")
);

CREATE TABLE fit.GenerationAccountInstallation (
    "GenerationAccountInstallationId" SERIAL,
    "InstallationId" int,
    "GenerationAccountId" int,
    "IsActive" boolean DEFAULT TRUE,
    "EffectiveDate" date,
    "EndDate" date,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    CONSTRAINT FK_GenerationAccountInstallation_GenerationAccount FOREIGN KEY ("GenerationAccountId") REFERENCES fit.GenerationAccount("GenerationAccountId"),
    CONSTRAINT FK_GenerationAccountInstallation_Installation FOREIGN KEY ("InstallationId") REFERENCES fit.Installation("InstallationId"),
    PRIMARY KEY ("GenerationAccountInstallationId")
);

CREATE TABLE fit.MeterType (
    "MeterTypeId" SERIAL,
    "MeterTypeTitle" varchar(50),
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    PRIMARY KEY ("MeterTypeId")
);

CREATE TABLE fit.TariffType (
    "TariffTypeId" SERIAL,
    "TariffTypeTitle" varchar(50),
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    PRIMARY KEY ("TariffTypeId")
);

CREATE TABLE fit.Tariff (
    "TariffId" SERIAL,
    "TariffTitle" varchar(50),
    "TariffTypeId" int,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    CONSTRAINT FK_Tariff_TariffType FOREIGN KEY ("TariffTypeId") REFERENCES fit.TariffType("TariffTypeId"),
    PRIMARY KEY ("TariffId")
);

CREATE TABLE fit.Meter (
    "MeterId" SERIAL,
    "MeterMake" varchar(50),
    "MeterModel" varchar(50),
    "MeterSerialNumber" varchar(50),
    "MPAN" bigint,
    "IsHHMetered" boolean,
    "GSP" char(2),
    "DistributionRegion" char(2),
    "MeterTypeId" int,
    "TariffId" int,
    "IsActive" boolean DEFAULT TRUE,
    "IsVirtualMeter" boolean DEFAULT FALSE,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    CONSTRAINT FK_Meter_Tariff FOREIGN KEY ("TariffId") REFERENCES fit.Tariff("TariffId"),
    CONSTRAINT FK_Meter_MeterType FOREIGN KEY ("MeterTypeId") REFERENCES fit.MeterType("MeterTypeId"),
    PRIMARY KEY ("MeterId")
);

CREATE TABLE fit.InstallationMeter (
    "InstallationMeterId" SERIAL,
    "MeterId" int,
    "InstallationId" int,
    "PercentageSplit" decimal(5,2) DEFAULT ((100.00)),
    "IsActive" boolean DEFAULT TRUE,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    CONSTRAINT FK_InstallationMeter_Meter FOREIGN KEY ("MeterId") REFERENCES fit.Meter("MeterId"),
    CONSTRAINT FK_InstallationMeter_Installation FOREIGN KEY ("InstallationId") REFERENCES fit.Installation("InstallationId"),
    PRIMARY KEY ("InstallationMeterId")
);

CREATE TABLE fit.InstallationSequence (
    "InstallationSequenceId" bigSERIAL,
    "DateGenerated" timestamp(3),
    PRIMARY KEY ("InstallationSequenceId")
);

CREATE TABLE fit.InstallationVerificationInfo (
    "InstallationVerificationInfoId" SERIAL,
    "InstallationId" int,
    "DateVerified" date,
    "ChangeRecorded" boolean,
    "ChangeDetail" varchar(255),
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    "MeterSerial" varchar(50) DEFAULT (''),
    "Outcome" varchar(50) DEFAULT (''),
    "MPAN" varchar(50),
    CONSTRAINT FK_Installation_InstallationVerificationInfoId FOREIGN KEY ("InstallationId") REFERENCES fit.Installation("InstallationId"),
    PRIMARY KEY ("InstallationVerificationInfoId")
);

CREATE TABLE fit.LoadFactor (
    "GeneratorTechnologyTypeId" int,
    "Q1" numeric(18,2),
    "Q2" numeric(18,2),
    "Q3" numeric(18,2),
    "Q4" numeric(18,2),
    "RegionId" int,
    "LoadFactorId" SERIAL,
    PRIMARY KEY ("LoadFactorId")
);

CREATE TABLE fit.Memo (
    "MemoId" SERIAL,
    "MemoSubject" varchar(50),
    "MemoDetail" varchar(2000),
    "FitAccountId" int,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    CONSTRAINT FK_Installation_FitAccount FOREIGN KEY ("FitAccountId") REFERENCES fit.FiTAccount("FiTAccountId"),
    PRIMARY KEY ("MemoId")
);

CREATE TABLE fit.MeterModel (
    "MeterModelId" SERIAL,
    "MeterMake" varchar(50),
    "MeterModel" varchar(50),
    PRIMARY KEY ("MeterModelId")
);

CREATE TABLE fit.MeterReading (
    "MeterReadingId" SERIAL,
    "MeterReadingValue" int,
    "DateOfReading" date,
    "ReadType" varchar(15),
    "MeterId" int,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    "ReadReason" varchar(25),
    CONSTRAINT FK_MeterReading_Meter FOREIGN KEY ("MeterId") REFERENCES fit.Meter("MeterId"),
    PRIMARY KEY ("MeterReadingId")
);

CREATE TABLE fit.MeterReadingHistory (
    "MeterReadingHistoryId" SERIAL,
    "MeterReadingId" int,
    "MeterReadingValue" int,
    "ReadType" varchar(15),
    "ReadReason" varchar(25),
    "MeterId" int,
    "DateOfReading" date,
    "ChangeReason" varchar(250),
    PRIMARY KEY ("MeterReadingHistoryId")
);

CREATE TABLE fit.Payment (
    "PaymentId" SERIAL,
    "PaymentAmount" decimal(10,2),
    "PaymentDate" timestamp(3),
    "PaymentType" varchar(25),
    "GenerationAccountId" int,
    "BankAccountId" int,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    "Failed" boolean DEFAULT FALSE,
    "CFRFiTId" varchar(50) DEFAULT (NULL),
    "SEGId" varchar(50),
    CONSTRAINT FK_Payment_GenerationAccount FOREIGN KEY ("GenerationAccountId") REFERENCES fit.GenerationAccount("GenerationAccountId"),
    CONSTRAINT FK_Payment_BankAccount FOREIGN KEY ("BankAccountId") REFERENCES fit.BankAccount("BankAccountId"),
    PRIMARY KEY ("PaymentId")
);


CREATE TABLE fit.SecurityQuestion (
    "SecurityQuestionId" SERIAL,
    "SecurityQuestion" varchar(35),
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    PRIMARY KEY ("SecurityQuestionId")
);

CREATE TABLE fit.SEGAccountSequence (
    "SEGAccountSequenceId" bigSERIAL,
    "DateGenerated" timestamp(3),
    PRIMARY KEY ("SEGAccountSequenceId")
);

CREATE TABLE fit.Switch (
    "SwitchId" SERIAL,
    "InstallationId" int,
    "IsSwitchIn" boolean,
    "Company" varchar(50),
    "ProposedSwitchDate" date,
    "ActualSwitchDate" date,
    "DateNotifiedOfSwitch" date,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    CONSTRAINT FK_Switch_Installation FOREIGN KEY ("InstallationId") REFERENCES fit.Installation("InstallationId"),
    PRIMARY KEY ("SwitchId")
);

CREATE TABLE fit.TariffExportRate (
    "TariffExportRateId" SERIAL,
    "TariffType" int,
    "TariffRate" decimal(10,2),
    "TariffRateStartDate" date,
    "TariffRateEndDate" date,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    PRIMARY KEY ("TariffExportRateId")
);

CREATE TABLE fit.TariffRate (
    "TariffRateId" SERIAL,
    "TariffRate" decimal(10,2),
    "TariffId" int,
    "TariffRateStartDate" date,
    "TariffRateEndDate" date,
    "DateInserted" timestamp(3) DEFAULT (now()),
    "DateUpdated" timestamp(3),
    "WhoInserted" varchar(255),
    "WhoUpdated" varchar(255),
    CONSTRAINT FK_TariffRate_Tariff FOREIGN KEY ("TariffId") REFERENCES fit.Tariff("TariffId"),
    PRIMARY KEY ("TariffRateId")
);

CREATE VIEW all_types_view AS
    SELECT *
    FROM all_types
    WHERE boolean_col IS NOT NULL;

COMMENT ON VIEW all_types_view IS 'Summurized view';

INSERT INTO all_types(not_null) VALUES (1), (2);

CREATE TABLE orders (
  region VARCHAR NOT NULL,
  product VARCHAR NOT NULL,
  quantity INT NOT NULL,
  amount INT NOT NULL
);

INSERT INTO orders VALUES
  ('Sofia', 'Sofa', 2, 50),
  ('Sofia', 'Chair', 5, 10),
  ('Sofia', 'Table', 1, 30),
  ('Plovdiv', 'Table', 2, 30),
  ('Plovdiv', 'Chair', 5, 20);
