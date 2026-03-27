-- Realtime enhancements for Zeno Trading Journal
-- Add this to your existing Supabase schema

-- Enable Realtime for tables
alter publication supabase_realtime add table public.trades;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.strategies;
alter publication supabase_realtime add table public.playbook_rules;
alter publication supabase_realtime add table public.module_completions;

-- Add user_analytics table for real-time analytics
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

-- Enable realtime for analytics table
alter publication supabase_realtime add table public.user_analytics;

-- RLS for analytics
alter table public.user_analytics enable row level security;
create policy "analytics: read own"   on public.user_analytics for select using (auth.uid() = user_id);
create policy "analytics: update own" on public.user_analytics for update using (auth.uid() = user_id);

-- Function to automatically update analytics after trade changes
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

-- Add realtime indexes for better performance
create index if not exists trades_user_date_idx on public.trades(user_id, date desc);
create index if not exists analytics_user_idx on public.user_analytics(user_id);

-- Add presence tracking table (optional)
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

alter publication supabase_realtime add table public.user_presence;

alter table public.user_presence enable row level security;
create policy "presence: read own"   on public.user_presence for select using (auth.uid() = user_id);
create policy "presence: update own" on public.user_presence for update using (auth.uid() = user_id);

-- Function to update presence
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
