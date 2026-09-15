-- ============================================================
-- Migração 010: torna o cálculo de título tolerante a variações
-- de texto na faixa (ex: "2º Dan", "Preta 2 Dan", "preta 2º dan").
-- Rode no SQL Editor do Supabase, depois da migration-009.
-- ============================================================

-- A migration-009 exigia o texto EXATO "Preta 2º Dan" etc. Se alguém
-- registrou a faixa de um jeito um pouco diferente (sem "Preta", com
-- espaço a mais, sem o "º"...), o título ficava vazio sem avisar nada.
-- Esta versão extrai o número do dan de dentro do texto, então funciona
-- mesmo com variações.

create or replace function public.set_titulo_por_faixa()
returns trigger as $$
declare
  f text := lower(coalesce(trim(new.faixa), ''));
  dan int;
begin
  if f = '' then
    new.titulo := null;
    return new;
  end if;

  dan := ((regexp_match(f, '(\d+)\s*[ºo]?\s*dan'))[1])::int;

  if dan is not null then
    if dan in (1, 2) then
      new.titulo := 'Kyosanim';
    elsif dan = 3 then
      new.titulo := 'Bukwanim';
    elsif dan in (4, 5) then
      new.titulo := 'Sabonim';
    elsif dan = 6 then
      new.titulo := 'Kwandjangnim';
    elsif dan = 9 then
      new.titulo := 'Chong Kwandjangnim';
    elsif dan in (7, 8) then
      -- título ainda não definido pra esse degrau — não mexe no que já tinha
      null;
    else
      new.titulo := null;
    end if;
  elsif f like '%honor%' or (f like '%vermelha%' and f like '%preta%') then
    new.titulo := 'Jokwanim';
  else
    new.titulo := null;
  end if;

  return new;
end;
$$ language plpgsql;

-- Reaplica em todo mundo, agora com a regra tolerante.
update public.profiles set faixa = faixa;

-- ============================================================
-- Se o título do Junior (ou de qualquer um) continuar vazio depois
-- desta migration, o problema não é mais o texto da faixa — aí vale
-- conferir direto no Table Editor o que está escrito em profiles.faixa
-- pra essa pessoa.
-- ============================================================
