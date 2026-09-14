-- ============================================================
-- Migração 008: destaque de instrutor/mestre na comunidade
-- Rode no SQL Editor do Supabase.
-- ============================================================

alter table public.profiles
  add column if not exists titulo text;

-- "titulo" é o título tradicional do instrutor (ex: 'Sabonim', 'Kyosanim',
-- 'Chong Kwanjangnim'). Igual a role/faixa/status, o aluno NUNCA pode
-- setar isso sozinho pela API — só você, manualmente, pelo Table Editor.
revoke all on public.profiles from authenticated, anon;

grant select, insert on public.profiles to authenticated;
grant update (nome_exibicao, foto_url, faixa_pendente, tipo, parentesco, parentesco_outro, atleta_nome)
  on public.profiles to authenticated;

-- ============================================================
-- Depois de rodar isto, pra dar destaque a um instrutor/mestre no feed:
--
-- Table Editor > profiles > ache a linha da pessoa e mude:
--   role   -> 'instrutor' (isso já coloca o anel dourado na foto)
--   titulo -> o título dela, ex: 'Sabonim' (aparece como selo ao lado do nome)
--
-- Exemplo: Junior Silva, Sabonim da Equipe Alfa (Atibaia) —
--   role = 'instrutor', titulo = 'Sabonim'
-- (depois de aprovar o cadastro dele: status = 'aprovado')
-- ============================================================
