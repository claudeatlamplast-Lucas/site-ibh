-- ============================================================
-- Corrige escolas duplicadas + trava nome como único
-- Cole este arquivo inteiro em: Supabase Dashboard > SQL Editor > New query > Run
-- Necessário porque a migration anterior rodou 2x e a tabela não tinha
-- unique(nome) — por isso "Instituto Brasileiro de Hapkido" ficou repetido.
-- ============================================================

-- Repassa qualquer aluno vinculado a uma escola duplicada para a escola "sobrevivente"
-- (a mais antiga entre as com o mesmo nome)
with sobrevivente as (
  select distinct on (nome) id, nome
  from public.escolas
  order by nome, criado_em asc, id asc
)
update public.profiles p
set escola_id = s.id
from public.escolas e
join sobrevivente s on s.nome = e.nome
where p.escola_id = e.id and e.id <> s.id;

-- Apaga as escolas duplicadas, mantendo só a mais antiga de cada nome
delete from public.escolas e
where e.id not in (
  select distinct on (nome) id
  from public.escolas
  order by nome, criado_em asc, id asc
);

-- Trava pra nunca mais duplicar
alter table public.escolas add constraint escolas_nome_key unique (nome);
-- ============================================================
