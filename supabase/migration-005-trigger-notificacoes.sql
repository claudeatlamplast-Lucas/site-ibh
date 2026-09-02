-- ============================================================
-- IBH — Comunidade de Alunos — Trigger de notificações (Migration 005)
-- Rode em: Supabase Dashboard > SQL Editor > New query
--
-- Por que via SQL e não pela tela "Database > Triggers"?
-- Nesse painel, "Function to trigger" só lista funções Postgres — não dá
-- pra apontar direto pra uma Edge Function ali. Então criamos a ligação
-- na mão: um trigger comum do Postgres que, usando a extensão pg_net,
-- chama a Edge Function "notificar-novo-post" por HTTP a cada post novo.
-- ============================================================

-- pg_net insiste em instalar suas funções no schema "net" — não force
-- "with schema extensions" aqui, ou a criação pode falhar silenciosamente.
create extension if not exists pg_net;

create or replace function public.notificar_novo_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://iishtrwbbvlbwlgdcysd.supabase.co/functions/v1/notificar-novo-post',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'COLOQUE_AQUI_O_MESMO_WEBHOOK_SECRET_DAS_SECRETS_DA_FUNCAO'
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notificar_novo_post on public.posts;

create trigger trg_notificar_novo_post
  after insert on public.posts
  for each row
  execute function public.notificar_novo_post();

-- ============================================================
-- Antes de rodar este script:
--
-- 1. A Edge Function "notificar-novo-post" já precisa estar publicada
--    (Edge Functions > notificar-novo-post), com os secrets:
--      VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, WEBHOOK_SECRET,
--      RESEND_API_KEY (opcional, ativa o envio de email), RESEND_FROM_EMAIL,
--      SITE_URL
--    WEBHOOK_SECRET tem que ser IGUAL ao valor colado no x-webhook-secret
--    aqui em cima. NÃO cole o valor real neste arquivo (ele é versionado no
--    git) — gere um novo valor aleatório e cole só nas Secrets da função e
--    no bloco acima, direto no SQL Editor antes de rodar.
--
-- 2. Em Edge Functions > notificar-novo-post > Settings, desative
--    "Enforce JWT Verification" — quem chama é o Postgres do próprio
--    projeto (via pg_net), não um usuário logado pelo app.
--
-- Depois de rodar: poste algo na comunidade com uma conta, e confira em
-- Edge Functions > notificar-novo-post > Logs se a chamada chegou.
-- ============================================================
