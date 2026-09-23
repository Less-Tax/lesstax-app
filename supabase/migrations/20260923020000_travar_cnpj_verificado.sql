-- Empresa verificada não troca de CNPJ pelo app.
--
-- A tela de editar empresa deixa mudar o CNPJ enquanto a empresa não foi
-- verificada. Depois da verificação, o CNPJ é o que a equipe confirmou: só
-- a equipe (SQL Editor ou chave de serviço) muda. Sem esta trava, quem
-- chamasse a API direto poderia trocar o CNPJ e manter o selo.

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
    if tg_op = 'UPDATE' and old.verificada_em is not null
       and new.cnpj is distinct from old.cnpj then
      raise exception 'O CNPJ de uma empresa verificada só é trocado pela equipe da Less Tax.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
