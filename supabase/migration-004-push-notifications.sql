-- ============================================================
-- IBH — Comunidade de Alunos — Notificações push (Migration 004)
-- Rode este script em: Supabase Dashboard > SQL Editor > New query
-- ============================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

revoke all on public.push_subscriptions from authenticated, anon;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- Cada aluno só vê, cria, atualiza e apaga a própria inscrição de notificação.
-- A Edge Function que dispara os avisos usa a service role, que ignora RLS.
create policy "push_subscriptions_select_proprio" on public.push_subscriptions for select
  using (user_id = auth.uid());

create policy "push_subscriptions_insert_proprio" on public.push_subscriptions for insert
  with check (user_id = auth.uid());

create policy "push_subscriptions_update_proprio" on public.push_subscriptions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "push_subscriptions_delete_proprio" on public.push_subscriptions for delete
  using (user_id = auth.uid());

-- ============================================================
-- Depois de rodar este script, faça isto no painel do Supabase:
--
-- 1. Edge Functions > Deploy a new function > nome "notificar-novo-post"
--    Cole o conteúdo de supabase/functions/notificar-novo-post/index.ts
--
-- 2. Nas Secrets dessa função (Edge Functions > notificar-novo-post > Secrets),
--    adicione (chaves geradas localmente pelo Claude — as privadas NUNCA
--    devem entrar no código nem no Git):
--      VAPID_PUBLIC_KEY  = (chave pública)
--      VAPID_PRIVATE_KEY = (chave privada)
--      VAPID_SUBJECT     = mailto:ibhapkido@outlook.com
--      WEBHOOK_SECRET    = (ver migration-005)
--
-- 3. Rode o script migration-005-trigger-notificacoes.sql — esse painel
--    não deixa apontar um trigger direto pra uma Edge Function, então a
--    ligação é feita ali por SQL (via pg_net), não pela tela de Webhooks.
--
-- (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem automaticamente
--  dentro de toda Edge Function — não precisa configurar isso.)
-- ============================================================
