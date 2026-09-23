-- Painel admin.
--
-- O painel roda no servidor com a chave de serviço (service_role), depois de
-- conferir que o e-mail logado está em ADMIN_EMAILS. Nada muda para quem usa
-- o app: anon e authenticated continuam sem acesso a estas funções.

-- verificar_empresa: garante que a chave de serviço pode chamar.
grant execute on function public.verificar_empresa(uuid, text, text) to service_role;

-- Desfazer uma verificação feita por engano. As cópias que perderam o CNPJ
-- não voltam a tê-lo: o dono de cada uma cadastra de novo, se for o caso.
create or replace function public.desfazer_verificacao(p_empresa uuid)
returns void
language plpgsql
as $$
begin
  update public.empresas
     set verificada_em = null,
         verificada_por = null,
         verificacao_metodo = null
   where id = p_empresa;
  if not found then
    raise exception 'Empresa % não encontrada.', p_empresa;
  end if;
end;
$$;

revoke execute on function public.desfazer_verificacao(uuid) from public, anon, authenticated;
grant execute on function public.desfazer_verificacao(uuid) to service_role;

-- A lista de eventos do painel ordena por data.
create index if not exists eventos_criado_em_idx on public.eventos (criado_em desc);
