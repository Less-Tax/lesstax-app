-- Cópias de um CNPJ verificado.
--
-- Quando a equipe verifica uma empresa, as outras contas que tinham cadastrado
-- o mesmo CNPJ perdem o CNPJ (e os dados da Receita ligados a ele). Os números
-- que essas contas digitaram continuam. A partir daí, ninguém mais consegue
-- usar esse CNPJ numa empresa não verificada.

alter table public.empresas
  add column if not exists cnpj_removido_em timestamptz;

-- ---------------------------------------------------------------------------
-- Regra: um CNPJ verificado não pode aparecer em outra empresa.
-- security definer porque precisa enxergar empresas de outras contas, que a
-- RLS esconde de quem está cadastrando.
-- ---------------------------------------------------------------------------
create or replace function public.bloquear_cnpj_verificado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.cnpj is not null and exists (
    select 1 from public.empresas e
    where e.cnpj = new.cnpj
      and e.verificada_em is not null
      and e.id <> new.id
  ) then
    raise exception 'Este CNPJ já foi confirmado por outra conta.'
      using errcode = 'P0001', hint = 'cnpj_ja_verificado';
  end if;
  return new;
end;
$$;

drop trigger if exists ao_usar_cnpj on public.empresas;
create trigger ao_usar_cnpj
  before insert or update of cnpj on public.empresas
  for each row execute function public.bloquear_cnpj_verificado();

-- ---------------------------------------------------------------------------
-- verificar_empresa passa a limpar as cópias.
-- ---------------------------------------------------------------------------
create or replace function public.verificar_empresa(
  p_empresa uuid,
  p_por     text,
  p_metodo  text default 'manual'
)
returns void
language plpgsql
as $$
declare
  v_cnpj text;
  v_copias int;
begin
  select cnpj into v_cnpj from public.empresas where id = p_empresa;
  if not found then
    raise exception 'Empresa % não encontrada.', p_empresa;
  end if;

  -- 1. As cópias perdem o CNPJ e o que veio da Receita por causa dele.
  if v_cnpj is not null then
    update public.empresas
       set cnpj = null,
           razao_social = null,
           nome_fantasia = null,
           porte = null,
           cnae_codigo = null,
           cnae_descricao = null,
           regime = null,
           municipio = null,
           uf = null,
           abertura = null,
           cnpj_removido_em = now()
     where cnpj = v_cnpj
       and id <> p_empresa;
    get diagnostics v_copias = row_count;
    if v_copias > 0 then
      raise notice 'CNPJ removido de % cópia(s).', v_copias;
    end if;
  end if;

  -- 2. A empresa é verificada.
  update public.empresas
     set verificada_em = now(),
         verificada_por = p_por,
         verificacao_metodo = p_metodo
   where id = p_empresa;
end;
$$;

revoke execute on function public.verificar_empresa(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.bloquear_cnpj_verificado() from public, anon, authenticated;
