-- ============================================================
-- Rede de escolas afiliadas — Migration
-- Cole este arquivo inteiro em: Supabase Dashboard > SQL Editor > New query > Run
-- Cadastro/edição de escolas é manual, só pelo Table Editor com a
-- service role — alunos nunca podem criar ou trocar a própria escola
-- direto pela API (só você autoriza).
-- ============================================================

create table if not exists public.escolas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  cidade text,
  uf text,
  mestre_responsavel text,
  logo_url text,
  criado_em timestamptz not null default now()
);

alter table public.profiles add column if not exists escola_id uuid references public.escolas(id);

alter table public.escolas enable row level security;

revoke all on public.escolas from authenticated, anon;
grant select on public.escolas to authenticated, anon;

create policy "escolas_select_publica" on public.escolas for select
  using (true);

-- Escolas iniciais — mesma lista da página Rede (rede.html): a sede e as filiadas.
insert into public.escolas (nome, cidade, uf, logo_url)
values
  ('Instituto Brasileiro de Hapkido', 'Piracaia', 'SP', null),
  ('Equipe Alfa', 'Atibaia', 'SP', 'assets/escolas/alfa.png'),
  ('Escola Paekho', 'Batatuba, Piracaia', 'SP', 'assets/escolas/paekho.png'),
  ('Associação Koga de Hapkido', 'Lavras', 'MG', 'assets/escolas/koga.png'),
  ('Escola Hyonmu', 'Atibaia', 'SP', 'assets/escolas/hyonmu.png'),
  ('Escola Calza', 'São Paulo', 'SP', null)
on conflict (nome) do nothing;

-- Vincula os alunos já cadastrados à escola do IBH
update public.profiles
set escola_id = (select id from public.escolas where nome = 'Instituto Brasileiro de Hapkido' limit 1)
where escola_id is null;

-- ---------- Depois de rodar este bloco ----------
--
-- Para afiliar uma nova escola: Table Editor > escolas > Insert row
--   (nome, cidade, uf, mestre_responsavel, logo_url).
-- Novos alunos dessa escola escolhem ela no cadastro, no site.
-- Ninguém troca a própria escola sozinho depois — se precisar mudar
-- um aluno de escola, faça em Table Editor > profiles > escola_id.
-- ============================================================
