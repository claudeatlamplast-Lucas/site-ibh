-- ============================================================
-- Migração 006: tipo de cadastro (atleta / pai-responsável)
-- Rode no SQL Editor do Supabase.
-- ============================================================

alter table public.profiles
  add column if not exists tipo text check (tipo in ('atleta','pai')),
  add column if not exists parentesco text check (parentesco in ('pai','mae','outro')),
  add column if not exists parentesco_outro text,
  add column if not exists atleta_nome text;

-- Alunos cadastrados antes desta migração ficam com tipo = null.
-- O site detecta isso no login (status = 'aprovado' e tipo = null) e
-- mostra a tela "Complete seu cadastro" com o feed desfocado atrás,
-- pedindo pra escolher atleta ou pai/responsável antes de liberar o feed.

revoke all on public.profiles from authenticated, anon;

grant select, insert on public.profiles to authenticated;
grant update (nome_exibicao, foto_url, faixa_pendente, tipo, parentesco, parentesco_outro, atleta_nome)
  on public.profiles to authenticated;

-- ============================================================
-- Nada manual necessário depois de rodar isto.
--
-- O selo da escola nos posts usa a coluna escolas.logo_url, que já
-- existe desde a migração de rede de escolas. Se alguma escola afiliada
-- ainda não tiver logo: Table Editor > escolas > logo_url (caminho de
-- imagem em assets/escolas/, como as já cadastradas).
-- ============================================================
