-- ============================================================
-- Migração 007: função de healthcheck pro monitor automático
-- Rode no SQL Editor do Supabase.
--
-- Cria uma função que só devolve booleanos sobre a estrutura do banco
-- (quais colunas/tabelas existem, se RLS está ligado) — nunca dados de
-- alunos. É "security definer" pra conseguir enxergar o esquema mesmo
-- sendo chamada com a chave anônima (pública), sem precisar dar acesso
-- nenhum a mais pro papel "anon". Usada pela rotina agendada que
-- verifica se o site e a comunidade estão saudáveis.
-- ============================================================

create or replace function public.monitor_healthcheck()
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_catalog
as $$
declare
  resultado jsonb;
begin
  resultado := jsonb_build_object(
    'checado_em', now(),
    'colunas_profiles', jsonb_build_object(
      'tipo', exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='tipo'),
      'parentesco', exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='parentesco'),
      'parentesco_outro', exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='parentesco_outro'),
      'atleta_nome', exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='atleta_nome'),
      'escola_id', exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='escola_id'),
      'faixa_pendente', exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='faixa_pendente')
    ),
    'tabelas', jsonb_build_object(
      'posts', to_regclass('public.posts') is not null,
      'comentarios', to_regclass('public.comentarios') is not null,
      'curtidas', to_regclass('public.curtidas') is not null,
      'escolas', to_regclass('public.escolas') is not null,
      'push_subscriptions', to_regclass('public.push_subscriptions') is not null
    ),
    'fk_posts_autor_ok', exists(select 1 from pg_constraint where conname = 'posts_autor_id_fkey'),
    'coluna_escolas_logo_url', exists(select 1 from information_schema.columns where table_schema='public' and table_name='escolas' and column_name='logo_url'),
    'rls_ativo', jsonb_build_object(
      'profiles', (select relrowsecurity from pg_class where relname='profiles' and relnamespace = 'public'::regnamespace),
      'posts', (select relrowsecurity from pg_class where relname='posts' and relnamespace = 'public'::regnamespace)
    )
  );

  resultado := resultado || jsonb_build_object(
    'ok', (
      (resultado->'colunas_profiles'->>'tipo')::boolean
      and (resultado->'colunas_profiles'->>'parentesco')::boolean
      and (resultado->'colunas_profiles'->>'parentesco_outro')::boolean
      and (resultado->'colunas_profiles'->>'atleta_nome')::boolean
      and (resultado->'colunas_profiles'->>'escola_id')::boolean
      and (resultado->'colunas_profiles'->>'faixa_pendente')::boolean
      and (resultado->'tabelas'->>'posts')::boolean
      and (resultado->'tabelas'->>'comentarios')::boolean
      and (resultado->'tabelas'->>'curtidas')::boolean
      and (resultado->'tabelas'->>'escolas')::boolean
      and (resultado->'tabelas'->>'push_subscriptions')::boolean
      and (resultado->>'fk_posts_autor_ok')::boolean
      and (resultado->>'coluna_escolas_logo_url')::boolean
      and (resultado->'rls_ativo'->>'profiles')::boolean
      and (resultado->'rls_ativo'->>'posts')::boolean
    )
  );

  return resultado;
end;
$$;

grant execute on function public.monitor_healthcheck() to anon;

-- ============================================================
-- A função é "stable" (só lê, nunca escreve) de propósito: isso deixa
-- o PostgREST aceitar chamar ela também por GET, com a anon key na
-- própria URL — mais simples pro monitor automático buscar (só uma
-- URL, sem precisar mandar cabeçalho POST customizado):
--
-- https://iishtrwbbvlbwlgdcysd.supabase.co/rest/v1/rpc/monitor_healthcheck?apikey=SUA_ANON_KEY
--
-- Teste direto no navegador nesse link, ou com curl:
--
-- curl -s "https://iishtrwbbvlbwlgdcysd.supabase.co/rest/v1/rpc/monitor_healthcheck?apikey=SUA_ANON_KEY"
--
-- Deve devolver um JSON com "ok": true. Se alguma migração futura
-- adicionar coluna/tabela nova que o feed depende, atualize esta função
-- pra incluir a checagem nova (senão o monitor não vai saber checar).
-- ============================================================
