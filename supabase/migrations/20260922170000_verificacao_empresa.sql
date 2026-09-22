-- Verificação de propriedade da empresa.
--
-- Regra: qualquer conta pode cadastrar qualquer CNPJ, mas só UMA empresa por
-- CNPJ pode estar verificada. Assim ninguém tranca o dono de verdade para fora
-- cadastrando o CNPJ dele antes.
--
-- A verificação só pode ser feita pela equipe (SQL Editor ou servidor com a
-- chave de serviço). O usuário do app não consegue se marcar como verificado.

alter table public.empresas
  add column if not exists verificada_em      timestamptz,
  add column if not exists verificada_por     text,
  add column if not exists verificacao_metodo text
    check (verificacao_metodo in ('manual', 'cpf', 'pix'));

-- As três andam juntas: ou a empresa está verificada por completo, ou não está.
alter table public.empresas drop constraint if exists verificacao_completa;
alter table public.empresas add constraint verificacao_completa check (
  (verificada_em is null and verificada_por is null and verificacao_metodo is null)
  or (verificada_em is not null and verificada_por is not null and verificacao_metodo is not null)
);

-- CNPJ deixa de ser único para todos...
alter table public.empresas drop constraint if exists empresas_cnpj_key;
create index if not exists empresas_cnpj_idx on public.empresas (cnpj);

-- ...e passa a ser único só entre as verificadas.
create unique index if not exists empresas_cnpj_verificada_unica
  on public.empresas (cnpj)
  where verificada_em is not null;

-- ---------------------------------------------------------------------------
-- Proteção: quem usa o app (anon ou authenticated) não mexe na verificação.
-- ---------------------------------------------------------------------------
create or replace function public.proteger_verificacao()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' and new.verificada_em is not null then
      raise exception 'A verificação da empresa é feita só pela equipe da Less Tax.'
        using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and (
         new.verificada_em      is distinct from old.verificada_em
      or new.verificada_por     is distinct from old.verificada_por
      or new.verificacao_metodo is distinct from old.verificacao_metodo
    ) then
      raise exception 'A verificação da empresa é feita só pela equipe da Less Tax.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists ao_mexer_na_verificacao on public.empresas;
create trigger ao_mexer_na_verificacao
  before insert or update on public.empresas
  for each row execute function public.proteger_verificacao();

-- ---------------------------------------------------------------------------
-- Atalho para a equipe verificar pelo SQL Editor:
--   select public.verificar_empresa('<id da empresa>', 'Matheus', 'manual');
-- ---------------------------------------------------------------------------
create or replace function public.verificar_empresa(
  p_empresa uuid,
  p_por     text,
  p_metodo  text default 'manual'
)
returns void
language plpgsql
as $$
begin
  update public.empresas
     set verificada_em = now(),
         verificada_por = p_por,
         verificacao_metodo = p_metodo
   where id = p_empresa;

  if not found then
    raise exception 'Empresa % não encontrada.', p_empresa;
  end if;
end;
$$;

-- Ninguém do app chama esta função; só a equipe (postgres) e o servidor (service_role).
revoke execute on function public.verificar_empresa(uuid, text, text) from public, anon, authenticated;
