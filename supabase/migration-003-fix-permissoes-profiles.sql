-- ============================================================
-- CORREÇÃO DE SEGURANÇA — rode isso o quanto antes.
--
-- O Supabase concede, por padrão, permissão ampla de UPDATE em
-- tabelas novas para o papel "authenticated". Os GRANT/REVOKE por
-- coluna que eu tinha feito antes não eram suficientes para
-- bloquear isso — um aluno logado conseguia mudar role, status e
-- faixa da própria linha direto por uma chamada de API, ignorando
-- a aprovação. Este script fecha essa brecha.
-- ============================================================

revoke all on public.profiles from authenticated, anon;

grant select, insert on public.profiles to authenticated;
grant update (nome_exibicao, foto_url, faixa_pendente) on public.profiles to authenticated;

-- ============================================================
-- Depois de rodar, vale conferir se ainda existe algum aluno com
-- role = 'admin' ou status = 'aprovado' que não deveria: Table Editor
-- > profiles > confira as linhas. A conta de teste já foi corrigida.
-- ============================================================
