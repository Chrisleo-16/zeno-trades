-- ─────────────────────────────────────────────────────────────────────────────
-- ZENO TRADING JOURNAL — Complete Supabase Schema with Realtime
-- Paste this entire file into Supabase → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 1: profiles
-- Extends Supabase's built-in auth.users.
-- auth.users handles email/password/OAuth — this table holds everything else.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  name               text not null default '',
  trading_style      text check (trading_style in ('Scalping','Day Trading','Swing Trading','Position Trading')),
  experience         text,
  risk_tolerance     text,
  preferred_session  text check (preferred_session in ('london','newyork','tokyo','sydney')) default 'london',
  target_account     integer default 10000,
  created_at         timestamp with time zone default now(),
  unique (user_id)
);

-- RLS: users can only see and edit their own profile
alter table public.profiles enable row level security;

create policy "profiles: read own"   on public.profiles for select using (auth.uid() = user_id);
create policy "profiles: insert own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = user_id);
create policy "profiles: delete own" on public.profiles for delete using (auth.uid() = user_id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 2: trades
-- Every trade the user logs. Core of the whole app.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.trades (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,

  -- Trade basics
  date             date not null,
  entry_time       text,
  pair             text not null,                          -- e.g. 'EUR/USD'
  type             text check (type in ('long','short','buy','sell')) not null,
  entry_price      numeric(12,5) not null,
  exit_price       numeric(12,5),
  quantity         numeric(10,2) default 1,
  pnl              numeric(10,2),                         -- in account currency ($)
  status           text check (status in ('win','loss','breakeven','open','pending')) not null,

  -- Analysis
  tags             text[] default '{}',                   -- ['fomo','late-entry',...]
  notes            text default '',
  strategy_used    text default 'Supply & Demand + FVG + FRVP',
  emotional_state  text check (emotional_state in ('calm','excited','fearful','frustrated','confident')) default 'calm',
  session_type     text check (session_type in ('london','newyork','tokyo','sydney')) default 'london',

  -- Performance
  risk_amount      numeric(10,2),                         -- $ risked
  r_multiple       numeric(6,2),                          -- pnl / risk_amount
  commission       numeric(8,2) default 0,
  rating           smallint check (rating between 1 and 5), -- execution quality

  -- Review
  reviewed         boolean default false,
  review_notes     text default '',
  setup_notes      text default '',
  checklist_completed boolean default false,
  violations       text[] default '{}',

  created_at       timestamp with time zone default now(),
  updated_at       timestamp with time zone default now()
);

-- Indexes for common query patterns
create index trades_user_id_idx  on public.trades(user_id);
create index trades_date_idx     on public.trades(date desc);
create index trades_pair_idx     on public.trades(pair);
create index trades_status_idx   on public.trades(status);
create index trades_user_date_idx on public.trades(user_id, date desc);

-- RLS
alter table public.trades enable row level security;

create policy "trades: read own"   on public.trades for select using (auth.uid() = user_id);
create policy "trades: insert own" on public.trades for insert with check (auth.uid() = user_id);
create policy "trades: update own" on public.trades for update using (auth.uid() = user_id);
create policy "trades: delete own" on public.trades for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 3: strategies
-- User's saved trading strategies (from AI advisor or manually added).
-- ─────────────────────────────────────────────────────────────────────────────
create table public.strategies (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  description      text default '',
  rules            text[] default '{}',
  timeframe        text default 'Multi-timeframe',
  target_pair      text default 'EUR/USD',
  risk_reward      text default '1:2',
  category         text check (category in ('scalp','day','swing','position')) default 'day',
  win_rate         numeric(5,2) default 0,
  trades_count     integer default 0,
  risk_level       text check (risk_level in ('low','medium','high')) default 'medium',
  confidence       numeric(3,2) default 0.5,
  active           boolean default true,
  created_at       timestamp with time zone default now(),
  updated_at       timestamp with time zone default now()
);

alter table public.strategies enable row level security;

create policy "strategies: read own"   on public.strategies for select using (auth.uid() = user_id);
create policy "strategies: insert own" on public.strategies for insert with check (auth.uid() = user_id);
create policy "strategies: update own" on public.strategies for update using (auth.uid() = user_id);
create policy "strategies: delete own" on public.strategies for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 4: playbook_rules
-- The user's personal trading laws (from the Playbook tab).
-- Each rule has a compliance score derived from trades.tags.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.playbook_rules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  rule_text   text not null,
  category    text check (category in ('risk','entry','exit','psychology','timing')) not null,
  break_tag   text,       -- which tag in trades.tags signals this rule was broken
  sort_order  integer default 0,
  created_at  timestamp with time zone default now()
);

alter table public.playbook_rules enable row level security;

create policy "rules: read own"   on public.playbook_rules for select using (auth.uid() = user_id);
create policy "rules: insert own" on public.playbook_rules for insert with check (auth.uid() = user_id);
create policy "rules: update own" on public.playbook_rules for update using (auth.uid() = user_id);
create policy "rules: delete own" on public.playbook_rules for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 5: learning_modules
-- The educational content (global — not per user).
-- No RLS needed — all users can read all modules.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.learning_modules (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  type        text check (type in ('guide','psychology','case-study','video')) not null,
  description text default '',
  content     text default '',            -- markdown content
  difficulty  text check (difficulty in ('beginner','intermediate','advanced')) default 'beginner',
  duration    text default '20 minutes',
  sort_order  integer default 0,
  created_at  timestamp with time zone default now()
);

alter table public.learning_modules enable row level security;
create policy "modules: anyone can read" on public.learning_modules for select using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 6: module_completions
-- Tracks which modules each user has completed.
-- Separate join table so modules stay global and completions stay personal.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.module_completions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  module_id    uuid not null references public.learning_modules(id) on delete cascade,
  completed_at timestamp with time zone default now(),
  unique (user_id, module_id)              -- can't complete same module twice
);

alter table public.module_completions enable row level security;

create policy "completions: read own"   on public.module_completions for select using (auth.uid() = user_id);
create policy "completions: insert own" on public.module_completions for insert with check (auth.uid() = user_id);
create policy "completions: delete own" on public.module_completions for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 7: ai_conversations
-- Persists AI coach chat history so it continues across sessions.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text check (role in ('user','assistant')) not null,
  content     text not null,
  created_at  timestamp with time zone default now()
);

create index ai_conversations_user_idx on public.ai_conversations(user_id, created_at desc);

alter table public.ai_conversations enable row level security;

create policy "ai: read own"   on public.ai_conversations for select using (auth.uid() = user_id);
create policy "ai: insert own" on public.ai_conversations for insert with check (auth.uid() = user_id);
create policy "ai: delete own" on public.ai_conversations for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 8: user_analytics (NEW)
-- Real-time analytics calculated from trades
-- ─────────────────────────────────────────────────────────────────────────────
create table public.user_analytics (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  total_trades         integer default 0,
  winning_trades       integer default 0,
  losing_trades        integer default 0,
  win_rate             numeric(5,2) default 0,
  total_pnl            numeric(12,2) default 0,
  max_drawdown         numeric(12,2) default 0,
  current_drawdown     numeric(12,2) default 0,
  consecutive_wins     integer default 0,
  consecutive_losses   integer default 0,
  avg_win              numeric(10,2) default 0,
  avg_loss             numeric(10,2) default 0,
  profit_factor        numeric(6,2) default 0,
  sharpe_ratio         numeric(6,2) default 0,
  largest_win          numeric(12,2) default 0,
  largest_loss         numeric(12,2) default 0,
  total_risked         numeric(12,2) default 0,
  total_r_multiple     numeric(6,2) default 0,
  updated_at           timestamp with time zone default now(),
  unique (user_id)
);

-- Index for analytics
create index analytics_user_idx on public.user_analytics(user_id);

-- RLS for analytics
alter table public.user_analytics enable row level security;
create policy "analytics: read own"   on public.user_analytics for select using (auth.uid() = user_id);
create policy "analytics: update own" on public.user_analytics for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 9: user_presence (NEW)
-- Track user online status for realtime features
-- ─────────────────────────────────────────────────────────────────────────────
create table public.user_presence (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  status      text check (status in ('online', 'away', 'offline')) default 'online',
  last_seen   timestamp with time zone default now(),
  session_id  text default '',
  metadata    jsonb default '{}',
  created_at  timestamp with time zone default now(),
  updated_at  timestamp with time zone default now()
);

alter table public.user_presence enable row level security;
create policy "presence: read own"   on public.user_presence for select using (auth.uid() = user_id);
create policy "presence: update own" on public.user_presence for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- REALTIME SETUP
-- Enable Realtime for all tables
-- ─────────────────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.trades;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.strategies;
alter publication supabase_realtime add table public.playbook_rules;
alter publication supabase_realtime add table public.module_completions;
alter publication supabase_realtime add table public.user_analytics;
alter publication supabase_realtime add table public.user_presence;

-- ─────────────────────────────────────────────────────────────────────────────
-- ANALYTICS FUNCTIONS
-- Automatically update analytics when trades change
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.update_user_analytics(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_total_trades integer;
  v_winning_trades integer;
  v_losing_trades integer;
  v_win_rate numeric(5,2);
  v_total_pnl numeric(12,2);
  v_avg_win numeric(10,2);
  v_avg_loss numeric(10,2);
  v_profit_factor numeric(6,2);
  v_largest_win numeric(12,2);
  v_largest_loss numeric(12,2);
  v_total_risked numeric(12,2);
  v_total_r_multiple numeric(6,2);
begin
  -- Calculate basic stats
  select 
    count(*) as total_trades,
    count(*) filter (where status = 'win') as winning_trades,
    count(*) filter (where status = 'loss') as losing_trades,
    round(count(*) filter (where status = 'win')::numeric / nullif(count(*), 0) * 100, 2) as win_rate,
    coalesce(sum(pnl), 0) as total_pnl,
    coalesce(avg(pnl) filter (where status = 'win'), 0) as avg_win,
    coalesce(abs(avg(pnl) filter (where status = 'loss')), 0) as avg_loss,
    coalesce(max(pnl) filter (where status = 'win'), 0) as largest_win,
    coalesce(abs(min(pnl) filter (where status = 'loss')), 0) as largest_loss,
    coalesce(sum(risk_amount), 0) as total_risked,
    coalesce(avg(r_multiple), 0) as total_r_multiple
  into 
    v_total_trades, v_winning_trades, v_losing_trades, v_win_rate, v_total_pnl,
    v_avg_win, v_avg_loss, v_largest_win, v_largest_loss, v_total_risked, v_total_r_multiple
  from public.trades
  where user_id = p_user_id;

  -- Calculate profit factor
  select 
    round(
      coalesce(abs(sum(pnl) filter (where pnl > 0)), 0) / 
      nullif(abs(sum(pnl) filter (where pnl < 0)), 0), 2
    )
  into v_profit_factor
  from public.trades
  where user_id = p_user_id;

  -- Upsert analytics
  insert into public.user_analytics (
    user_id, total_trades, winning_trades, losing_trades, win_rate,
    total_pnl, avg_win, avg_loss, profit_factor, largest_win,
    largest_loss, total_risked, total_r_multiple, updated_at
  ) values (
    p_user_id, v_total_trades, v_winning_trades, v_losing_trades, v_win_rate,
    v_total_pnl, v_avg_win, v_avg_loss, v_profit_factor, v_largest_win,
    v_largest_loss, v_total_risked, v_total_r_multiple, now()
  )
  on conflict (user_id) do update set
    total_trades = excluded.total_trades,
    winning_trades = excluded.winning_trades,
    losing_trades = excluded.losing_trades,
    win_rate = excluded.win_rate,
    total_pnl = excluded.total_pnl,
    avg_win = excluded.avg_win,
    avg_loss = excluded.avg_loss,
    profit_factor = excluded.profit_factor,
    largest_win = excluded.largest_win,
    largest_loss = excluded.largest_loss,
    total_risked = excluded.total_risked,
    total_r_multiple = excluded.total_r_multiple,
    updated_at = now();
end;
$$;

-- Triggers to automatically update analytics
create trigger update_analytics_after_trade_insert
  after insert on public.trades
  for each row execute procedure public.update_user_analytics(new.user_id);

create trigger update_analytics_after_trade_update
  after update on public.trades
  for each row execute procedure public.update_user_analytics(new.user_id);

create trigger update_analytics_after_trade_delete
  after delete on public.trades
  for each row execute procedure public.update_user_analytics(old.user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PRESENCE FUNCTIONS
-- Track user online status
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.update_presence(p_status text default 'online')
returns void language plpgsql security definer as $$
begin
  insert into public.user_presence (user_id, status, last_seen)
  values (auth.uid(), p_status, now())
  on conflict (user_id) do update set
    status = excluded.status,
    last_seen = excluded.last_seen,
    updated_at = now();
end;
$$;
create or replace function public.update_user_analytics_trigger()
returns trigger
language plpgsql
as $$
begin
  -- Handle INSERT & UPDATE
  if (tg_op = 'INSERT' or tg_op = 'UPDATE') then
    perform public.calculate_user_analytics(new.user_id);
    return new;
  end if;

  -- Handle DELETE
  if (tg_op = 'DELETE') then
    perform public.calculate_user_analytics(old.user_id);
    return old;
  end if;

  return null;
end;
$$;
-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: insert your 8 default playbook rules for every new user
-- Call this function after a user's first login
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.seed_default_rules(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  insert into public.playbook_rules (user_id, rule_text, category, break_tag, sort_order) values
    (p_user_id, 'No gambling — only take setups that match Supply & Demand + FVG + FRVP', 'entry',      'fomo',         1),
    (p_user_id, 'Risk only 20% of current account balance per trade',                    'risk',        'oversized',    2),
    (p_user_id, 'Do NOT enter due to FOMO — wait for price confirmation',                'psychology',  'fomo',         3),
    (p_user_id, 'Do NOT revenge trade after a loss',                                     'psychology',  'revenge-trade',4),
    (p_user_id, 'Wait for price to retrace before entering',                             'entry',       'early-exit',   5),
    (p_user_id, 'Always set a stop loss before entering',                               'risk',        'no-stop',      6),
    (p_user_id, 'Do not allow greed to override your trading discipline',               'psychology',  'fomo',         7),
    (p_user_id, 'Be disciplined — follow the rules every single day',                  'psychology',   null,           8)
  on conflict do nothing;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- USEFUL VIEWS (optional but powerful)
-- ─────────────────────────────────────────────────────────────────────────────

-- Win rate per pair per user
create view public.pair_stats as
select
  user_id,
  pair,
  count(*)                                              as total_trades,
  count(*) filter (where status = 'win')                as wins,
  count(*) filter (where status = 'loss')               as losses,
  round(
    count(*) filter (where status = 'win')::numeric
    / nullif(count(*), 0) * 100, 1
  )                                                      as win_rate_pct,
  round(sum(pnl), 2)                                    as total_pnl,
  round(avg(r_multiple), 2)                             as avg_r
from public.trades
group by user_id, pair;

-- Rule compliance per user (joins playbook_rules with trades.tags)
create view public.rule_compliance as
select
  r.user_id,
  r.id          as rule_id,
  r.rule_text,
  r.category,
  r.break_tag,
  count(t.id)                                           as total_trades,
  count(t.id) filter (
    where r.break_tag is not null
    and r.break_tag = any(t.tags)
  )                                                     as times_broken,
  round(
    1 - count(t.id) filter (
      where r.break_tag is not null
      and r.break_tag = any(t.tags)
    )::numeric / nullif(count(t.id), 0), 3
  )                                                     as compliance_rate
from public.playbook_rules r
left join public.trades t on t.user_id = r.user_id
group by r.user_id, r.id, r.rule_text, r.category, r.break_tag;
