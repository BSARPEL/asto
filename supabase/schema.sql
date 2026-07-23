-- Optional Supabase/Postgres schema (production uses Firebase Firestore by default).
-- Mirrors packages/shared types + firestore-schema.ts

create table if not exists profiles (
  id text primary key,
  email text not null unique,
  display_name text not null,
  password_hash text not null,
  token_balance int not null default 5,
  is_subscribed boolean not null default false,
  birth jsonb,
  natal_chart jsonb,
  chart_narrative text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  token text primary key,
  user_id text not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists partners (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  birth jsonb not null,
  natal_chart jsonb not null,
  synastry_score int,
  synastry_score_note text,
  analysis text,
  conversation_id text,
  created_at timestamptz not null default now()
);

create table if not exists readings (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  date date not null,
  summary text not null,
  themes text[] not null default '{}',
  conversation_id text,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

create table if not exists conversations (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  title text not null,
  kind text check (kind in ('daily', 'synastry')),
  partner_id text,
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists token_ledger (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  delta int not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists ad_claims (
  user_id text not null references profiles(id) on delete cascade,
  date date not null,
  count int not null default 0,
  primary key (user_id, date)
);

create index if not exists idx_partners_user_id on partners(user_id);
create index if not exists idx_conversations_user_id on conversations(user_id);
create index if not exists idx_ledger_user_id on token_ledger(user_id);
create index if not exists idx_readings_user_id on readings(user_id);
