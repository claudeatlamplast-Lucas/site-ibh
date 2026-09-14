-- ============================================================
-- Migração 009: título (patente) automático pela faixa
-- Rode no SQL Editor do Supabase, depois da migration-008.
-- ============================================================

-- Sempre que a coluna faixa muda (cadastro novo ou você aprovando uma
-- troca de faixa), essa função recalcula o titulo sozinha, de acordo
-- com a tabela oficial de patentes do Instituto:
--
--   Vermelha p/ Preta, Preta Honorário -> Jokwanim
--   Preta 1º/2º Dan                    -> Kyosanim
--   Preta 3º Dan                       -> Bukwanim
--   Preta 4º/5º Dan                    -> Sabonim
--   Preta 6º Dan                       -> Kwandjangnim
--   Preta 7º/8º Dan                    -> (ainda não definido — não mexe)
--   Preta 9º Dan                       -> Chong Kwandjangnim
--   faixas abaixo de Vermelha p/ Preta -> sem título (null)
--
-- Faixas de 7º/8º Dan não estão na lista do formulário do site (raras
-- demais pra aparecer no cadastro público) — se um dia precisar, dá pra
-- editar direto em profiles.faixa pelo Table Editor e ajustar esta
-- função depois.

create or replace function public.set_titulo_por_faixa()
returns trigger as $$
begin
  if new.faixa is null then
    new.titulo := null;
  elsif new.faixa in ('Vermelha p/ Preta', 'Preta Honorário') then
    new.titulo := 'Jokwanim';
  elsif new.faixa in ('Preta 1º Dan', 'Preta 2º Dan') then
    new.titulo := 'Kyosanim';
  elsif new.faixa = 'Preta 3º Dan' then
    new.titulo := 'Bukwanim';
  elsif new.faixa in ('Preta 4º Dan', 'Preta 5º Dan') then
    new.titulo := 'Sabonim';
  elsif new.faixa = 'Preta 6º Dan' then
    new.titulo := 'Kwandjangnim';
  elsif new.faixa = 'Preta 9º Dan' then
    new.titulo := 'Chong Kwandjangnim';
  elsif new.faixa in ('Preta 7º Dan', 'Preta 8º Dan') then
    -- título ainda não definido pra esse degrau — não altera o que já tinha
    null;
  else
    -- Branca até Vermelha: ninguém tem título ainda
    new.titulo := null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_titulo_por_faixa on public.profiles;
create trigger trg_set_titulo_por_faixa
  before insert or update of faixa on public.profiles
  for each row execute function public.set_titulo_por_faixa();

-- Aplica a regra em quem já está cadastrado (o UPDATE abaixo "toca" a
-- coluna faixa mesmo sem mudar o valor, então o gatilho roda pra todo mundo).
update public.profiles set faixa = faixa;

-- ============================================================
-- Depois de rodar isto:
--
-- - O titulo vira automático: assim que você aprovar/corrigir a faixa
--   de alguém no Table Editor, o selo de patente já atualiza sozinho.
--   Não defina mais titulo manualmente — ele será sobrescrito na
--   próxima vez que a faixa dessa pessoa mudar.
--
-- - Confira o Junior Silva: o titulo dele só vai virar "Sabonim" de
--   novo (o que você já tinha setado manualmente) se a faixa dele
--   estiver como 'Preta 4º Dan' ou 'Preta 5º Dan'. Se a faixa dele
--   estiver diferente, ajuste em profiles.faixa pra refletir o dan real.
-- ============================================================
