-- ============================================================
-- Migração: troca de faixa com aprovação
-- Rode no SQL Editor do Supabase (o schema.sql já foi rodado antes,
-- então rode só isto agora — não o schema.sql inteiro de novo).
-- ============================================================

alter table public.profiles add column faixa_pendente text;

revoke update (faixa) on public.profiles from authenticated;
grant update (faixa_pendente) on public.profiles to authenticated;

-- ============================================================
-- Depois de rodar:
-- Para aprovar uma troca de faixa solicitada por um aluno:
-- Table Editor > profiles > ache o aluno com faixa_pendente preenchida
-- e faça manualmente:
--   faixa          -> copie o valor que está em faixa_pendente
--   faixa_pendente -> apague (deixe em branco/NULL)
-- ============================================================
