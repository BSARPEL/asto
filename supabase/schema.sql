-- Optional Supabase schema (local JSON store is used by default in packages/api)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  display_name text not null,
  token_balance int not null default 5,
  is_subscribed boolean not null default false,
  birth jsonb,
  natal_chart jsonb,
  created_at timestamptz not null default now()
);

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  birth jsonb not null,
  natal_chart jsonb not null,
  synastry_score int,
  analysis text,
  created_at timestamptz not null default now()
);

create table if not exists readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  summary text not null,
  themes text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists token_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  delta int not null,
  reason text not null,
  created_at timestamptz not null default now()
);
