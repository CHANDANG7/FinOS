-- Trading Journal Table
create table if not exists trading_journal (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  trade_type text not null check (trade_type in ('BUY', 'SELL')),
  quantity decimal not null,
  entry_price decimal not null,
  exit_price decimal,
  entry_date timestamptz not null,
  exit_date timestamptz,
  commission decimal default 0,
  taxes decimal default 0,
  net_pnl decimal,
  strategy text,
  tags text[],
  pre_trade_emotion text,
  post_trade_emotion text,
  notes text,
  screenshots text[], -- URLs to uploaded images
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policies for trading_journal
alter table trading_journal enable row level security;

create policy "Users can view own trades" on trading_journal
  for select using (auth.uid() = user_id);

create policy "Users can insert own trades" on trading_journal
  for insert with check (auth.uid() = user_id);

create policy "Users can update own trades" on trading_journal
  for update using (auth.uid() = user_id);

create policy "Users can delete own trades" on trading_journal
  for delete using (auth.uid() = user_id);

-- Trigger to auto-update updated_at
create trigger update_trading_journal_updated_at
    before update on trading_journal
    for each row
    execute function update_updated_at_column();

-- Index for better query performance
create index idx_trading_journal_user_id on trading_journal(user_id);
create index idx_trading_journal_entry_date on trading_journal(entry_date desc);
create index idx_trading_journal_symbol on trading_journal(symbol);
