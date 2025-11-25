-- Match Embeddings Function (for Vector Search)
create or replace function match_embeddings (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  source_table text,
  source_id uuid,
  similarity float
)
language plpgsql
stable
as $$
begin
  return query
  select
    embeddings.id,
    embeddings.content,
    embeddings.source_table,
    embeddings.source_id,
    1 - (embeddings.embedding <=> query_embedding) as similarity
  from embeddings
  where 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- Execute SQL Function (for Analyst Agent)
-- WARNING: This is a high-privilege function. In production, use a read-only role.
create or replace function exec_sql(query text)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  execute query into result;
  return result;
end;
$$;
