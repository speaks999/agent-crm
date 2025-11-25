-- Enable pgvector extension for embeddings
create extension if not exists vector;

-- Accounts (Companies)
create table accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  website text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Contacts (People)
create table contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  role text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Pipelines (Sales Stages)
create table pipelines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stages jsonb not null -- e.g., ["Lead", "Discovery", "Proposal", "Closed"]
);

-- Deals (Opportunities)
create table deals (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id),
  pipeline_id uuid references pipelines(id),
  name text not null,
  amount numeric,
  stage text not null,
  close_date date,
  status text default 'open', -- open, won, lost
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Interactions (Meetings, Calls, Notes)
create table interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id),
  deal_id uuid references deals(id),
  type text not null, -- call, meeting, email, note
  summary text,
  transcript text,
  audio_url text,
  sentiment text,
  created_at timestamp with time zone default now()
);

-- Embeddings (Vector Store)
create table embeddings (
  id uuid primary key default gen_random_uuid(),
  content text not null, -- The text chunk being embedded
  embedding vector(1536), -- OpenAI embedding dimension
  source_table text not null, -- 'contacts', 'interactions', etc.
  source_id uuid not null, -- ID of the record in the source table
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index on contacts(account_id);
create index on deals(account_id);
create index on deals(pipeline_id);
create index on interactions(contact_id);
create index on interactions(deal_id);
