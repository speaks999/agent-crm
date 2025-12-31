-- User preferences table for storing dashboard widget layouts and other settings
create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  widget_layout jsonb default '[]'::jsonb,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for fast lookup by user_id
create index if not exists idx_user_preferences_user_id on user_preferences(user_id);

-- Function to auto-update updated_at timestamp
create or replace function update_user_preferences_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at on row update
drop trigger if exists user_preferences_updated_at on user_preferences;
create trigger user_preferences_updated_at
  before update on user_preferences
  for each row
  execute function update_user_preferences_updated_at();

-- Enable RLS (Row Level Security)
alter table user_preferences enable row level security;

-- Policy: Users can only see/modify their own preferences
create policy "Users can view own preferences"
  on user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on user_preferences for update
  using (auth.uid() = user_id);

create policy "Users can delete own preferences"
  on user_preferences for delete
  using (auth.uid() = user_id);

