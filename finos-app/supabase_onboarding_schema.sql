-- Onboarding Data Table
create table if not exists user_onboarding (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  wallet_balance decimal default 0,
  initial_portfolio jsonb, -- Array of {symbol, quantity, buyPrice}
  watchlist text[],
  financial_goals jsonb, -- {primaryGoal, riskTolerance}
  completed_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policies for user_onboarding
alter table user_onboarding enable row level security;

create policy "Users can view own onboarding" on user_onboarding
  for select using (auth.uid() = user_id);

create policy "Users can insert own onboarding" on user_onboarding
  for insert with check (auth.uid() = user_id);

create policy "Users can update own onboarding" on user_onboarding
  for update using (auth.uid() = user_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger update_user_onboarding_updated_at
    before update on user_onboarding
    for each row
    execute function update_updated_at_column();
