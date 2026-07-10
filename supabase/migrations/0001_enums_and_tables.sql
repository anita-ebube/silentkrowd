-- ============================================================================
-- 0001_enums_and_tables.sql
-- SilentKrowd Lounge — core schema
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------

create type app_role as enum ('admin', 'staff');

create type staff_status as enum ('active', 'suspended');

create type menu_category as enum ('food', 'drinks', 'wine', 'spirits', 'desserts');

create type order_status as enum (
  'pending_payment',
  'paid',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded'
);

create type payment_status as enum ('pending', 'success', 'failed', 'refunded');

create type coupon_discount_type as enum ('percentage', 'fixed');

-- ----------------------------------------------------------------------------
-- PROFILES (admin / staff — 1:1 with auth.users)
-- ----------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  role app_role not null default 'staff',
  status staff_status not null default 'active',
  avatar_url text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on profiles (role);
create index profiles_status_idx on profiles (status);

-- ----------------------------------------------------------------------------
-- CUSTOMERS (guests — identified by phone number)
-- ----------------------------------------------------------------------------

create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  email text,
  total_orders integer not null default 0,
  total_spent numeric(12, 2) not null default 0,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_phone_idx on customers (phone);
create index customers_email_idx on customers (email);

-- ----------------------------------------------------------------------------
-- COUPONS
-- ----------------------------------------------------------------------------

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type coupon_discount_type not null,
  discount_value numeric(12, 2) not null,
  max_discount numeric(12, 2),
  min_order_amount numeric(12, 2) not null default 0,
  usage_limit integer,
  times_used integer not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_percentage_range check (
    discount_type <> 'percentage' or (discount_value > 0 and discount_value <= 100)
  )
);

create index coupons_code_idx on coupons (code);
create index coupons_active_idx on coupons (active);

-- ----------------------------------------------------------------------------
-- ORDERS
-- ----------------------------------------------------------------------------

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references customers (id) on delete restrict,
  assigned_staff_id uuid references profiles (id) on delete set null,
  status order_status not null default 'pending_payment',

  delivery_address text not null,
  delivery_instructions text,

  subtotal numeric(12, 2) not null default 0,
  delivery_fee numeric(12, 2) not null default 7000,
  coupon_id uuid references coupons (id) on delete set null,
  discount_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,

  cancelled_reason text,
  cancelled_at timestamptz,
  confirmed_at timestamptz,
  delivered_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint orders_amounts_non_negative check (
    subtotal >= 0 and delivery_fee >= 0 and discount_amount >= 0 and total_amount >= 0
  )
);

create index orders_customer_idx on orders (customer_id);
create index orders_status_idx on orders (status);
create index orders_order_number_idx on orders (order_number);
create index orders_assigned_staff_idx on orders (assigned_staff_id);
create index orders_created_at_idx on orders (created_at desc);

-- ----------------------------------------------------------------------------
-- ORDER ITEMS
-- Snapshot of menu item at time of order (menu currently lives in src/data/menu.ts,
-- not in the DB — see note in 0002_functions_triggers.sql). menu_item_id is kept
-- as a plain integer reference to that static catalogue's `id` field.
-- ----------------------------------------------------------------------------

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  menu_item_id integer not null,
  name text not null,
  category menu_category not null,
  unit_price numeric(12, 2) not null,
  quantity integer not null check (quantity > 0),
  line_total numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create index order_items_order_idx on order_items (order_id);

-- ----------------------------------------------------------------------------
-- PAYMENTS
-- ----------------------------------------------------------------------------

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  reference text not null unique,
  amount numeric(12, 2) not null,
  status payment_status not null default 'pending',
  gateway_response text,
  channel text,
  paid_at timestamptz,
  refunded_at timestamptz,
  refunded_by uuid references profiles (id) on delete set null,
  raw_verification jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_idx on payments (order_id);
create index payments_reference_idx on payments (reference);
create index payments_status_idx on payments (status);

-- ----------------------------------------------------------------------------
-- STAFF ACTIVITY LOGS
-- ----------------------------------------------------------------------------

create table staff_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles (id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index staff_activity_logs_actor_idx on staff_activity_logs (actor_id);
create index staff_activity_logs_created_at_idx on staff_activity_logs (created_at desc);

-- ----------------------------------------------------------------------------
-- SETTINGS (key/value store — delivery fee, business hours, etc.)
-- ----------------------------------------------------------------------------

create table settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
