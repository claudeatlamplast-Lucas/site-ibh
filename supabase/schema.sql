-- ============================================================
-- IBH — Comunidade de Alunos — Schema Supabase
-- Rode este script inteiro em: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ---------- Tabelas ----------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_exibicao text not null,
  foto_url text,
  faixa text,
  faixa_pendente text,
  role text not null default 'aluno' check (role in ('aluno','instrutor','admin')),
  status text not null default 'pendente' check (status in ('pendente','aprovado','rejeitado')),
  criado_em timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references public.profiles(id) on delete cascade,
  foto_url text not null,
  legenda text,
  criado_em timestamptz not null default now()
);

create table public.comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  autor_id uuid not null references public.profiles(id) on delete cascade,
  texto text not null,
  criado_em timestamptz not null default now()
);

create table public.curtidas (
  post_id uuid not null references public.posts(id) on delete cascade,
  autor_id uuid not null references public.profiles(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (post_id, autor_id)
);

-- ---------- Row Level Security ----------

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comentarios enable row level security;
alter table public.curtidas enable row level security;

-- O Supabase concede, por padrão, UPDATE amplo em tabelas novas para
-- authenticated/anon — precisamos revogar tudo em profiles antes de
-- conceder só o que realmente deve ser permitido (senão um aluno logado
-- conseguiria mudar role/status/faixa da própria linha direto pela API).
revoke all on public.profiles from authenticated, anon;

grant select, insert on public.profiles to authenticated;
grant select, insert, delete on public.posts to authenticated;
grant select, insert, delete on public.comentarios to authenticated;
grant select, insert, delete on public.curtidas to authenticated;

-- Aluno só pode alterar os próprios dados de perfil — nunca role/status/faixa direto
-- (troca de faixa passa por faixa_pendente; aprovação só acontece via Table Editor,
-- com a service role, que ignora essas restrições de coluna)
grant update (nome_exibicao, foto_url, faixa_pendente) on public.profiles to authenticated;

-- profiles: leitura de quem está aprovado, ou do próprio perfil (mesmo pendente); insert/update do próprio
create policy "profiles_select" on public.profiles for select
  using (status = 'aprovado' or id = auth.uid());

create policy "profiles_insert_self" on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_self" on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- posts: leitura/escrita só para quem está aprovado; exclusão do autor ou de um admin
create policy "posts_select_aprovados" on public.posts for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'aprovado'));

create policy "posts_insert_aprovados" on public.posts for insert
  with check (
    autor_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'aprovado')
  );

create policy "posts_delete_autor_ou_admin" on public.posts for delete
  using (
    autor_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- comentarios: mesmas regras de posts
create policy "comentarios_select_aprovados" on public.comentarios for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'aprovado'));

create policy "comentarios_insert_aprovados" on public.comentarios for insert
  with check (
    autor_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'aprovado')
  );

create policy "comentarios_delete_autor_ou_admin" on public.comentarios for delete
  using (
    autor_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- curtidas: aprovados curtem; só apagam a própria curtida (toggle)
create policy "curtidas_select_aprovados" on public.curtidas for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'aprovado'));

create policy "curtidas_insert_aprovados" on public.curtidas for insert
  with check (
    autor_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'aprovado')
  );

create policy "curtidas_delete_autor" on public.curtidas for delete
  using (autor_id = auth.uid());

-- ---------- Storage (fotos de perfil e de posts) ----------

insert into storage.buckets (id, name, public)
values ('comunidade-fotos', 'comunidade-fotos', true)
on conflict (id) do nothing;

create policy "comunidade_fotos_leitura_publica" on storage.objects for select
  using (bucket_id = 'comunidade-fotos');

create policy "comunidade_fotos_upload_proprio" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'comunidade-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Depois de rodar este script, faça isto no painel do Supabase:
--
-- 1. Authentication > Providers > Email > desative "Confirm email".
--    Sem isso, todo cadastro fica esperando confirmação por e-mail
--    antes de poder logar — não é o fluxo simples que combinamos.
--
-- 2. Cadastre-se pela tela "Comunidade" do site (com sua própria conta).
--
-- 3. Table Editor > profiles > ache sua linha e mude manualmente:
--      role   -> admin
--      status -> aprovado
--    Esse é o único jeito de existir o primeiro admin (você, Lucas).
--
-- 4. Para aprovar cada novo aluno depois: Table Editor > profiles >
--    mude a coluna status de 'pendente' para 'aprovado' (ou 'rejeitado').
--
-- 5. Para aprovar uma troca de faixa: Table Editor > profiles > ache o aluno
--    com faixa_pendente preenchida e faça manualmente:
--      faixa          -> copie o valor que está em faixa_pendente
--      faixa_pendente -> apague (deixe em branco/NULL)
-- ============================================================
