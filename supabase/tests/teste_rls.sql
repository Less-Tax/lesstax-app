-- Teste da RLS: um usuário não pode ver nem tocar na empresa do outro.
-- Rode inteiro no SQL Editor do lesstax-dev. As nove linhas saem juntas no fim.
-- O próprio script apaga o que criou.

create temp table if not exists resultados (ordem int, resultado text);
truncate resultados;
grant all on resultados to authenticated;

-- Dois usuários de teste. O gatilho cria os perfis sozinho.
insert into auth.users (id, email, raw_user_meta_data)
values ('11111111-1111-1111-1111-111111111111', 'ana@teste.local',   '{"nome":"Ana"}'),
       ('22222222-2222-2222-2222-222222222222', 'bruno@teste.local', '{"nome":"Bruno"}')
on conflict (id) do nothing;

-- Um lead, para conferir se a tabela do servidor fica invisível.
insert into public.leads (nome, whatsapp, whatsapp_digitos)
values ('Lead de teste', '(47) 90000-0000', '47900000000');

-- ---------------------------------------------------------------- Ana entra
set role authenticated;
set request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into public.empresas (nome, atividade, criado_por)
values ('Padaria da Ana', 'comercio', '11111111-1111-1111-1111-111111111111');

insert into public.meses (empresa_id, ano, mes, faturamento)
select id, 2026, 9, 30000 from public.empresas where nome = 'Padaria da Ana';

-- Guarda o id da empresa da Ana para o Bruno tentar gravar nela.
create temp table if not exists alvo (id uuid);
truncate alvo;
grant all on alvo to authenticated;
insert into alvo select id from public.empresas where nome = 'Padaria da Ana';

-- -------------------------------------------------------------- Bruno entra
set request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

insert into public.empresas (nome, atividade, criado_por)
values ('Studio do Bruno', 'profissionais', '22222222-2222-2222-2222-222222222222');

-- 1. Bruno só enxerga a empresa dele.
insert into resultados
select 1, case when count(*) = 1 and min(nome) = 'Studio do Bruno'
               then 'OK      1. Bruno vê só a empresa dele'
               else 'FALHOU  1. Bruno está vendo ' || count(*) || ' empresas' end
from public.empresas;

-- 2. Bruno não enxerga os meses da Ana.
insert into resultados
select 2, case when count(*) = 0
               then 'OK      2. Bruno não vê os meses da Ana'
               else 'FALHOU  2. vazaram ' || count(*) || ' meses' end
from public.meses;

-- 3. Bruno não consegue gravar na empresa da Ana.
do $$
declare
  empresa_da_ana uuid;
begin
  select id into empresa_da_ana from alvo;
  begin
    insert into public.meses (empresa_id, ano, mes, faturamento)
    values (empresa_da_ana, 2026, 9, 99999);
    insert into resultados values (3, 'FALHOU  3. Bruno gravou na empresa da Ana');
  exception when insufficient_privilege then
    insert into resultados values (3, 'OK      3. a RLS bloqueou a gravação');
  end;
end;
$$;

-- ------------------------------------------------------------- Ana de volta
set request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- 4. Ana continua vendo o mês dela.
insert into resultados
select 4, case when count(*) = 1
               then 'OK      4. Ana vê o mês dela'
               else 'FALHOU  4. Ana vê ' || count(*) || ' meses' end
from public.meses;

-- 5. Quem está logado não lê a tabela de leads (ela é só do servidor).
insert into resultados
select 5, case when count(*) = 0
               then 'OK      5. leads invisível para usuário logado'
               else 'FALHOU  5. leads exposta' end
from public.leads;

-- 6 e 7. Verificação da empresa. CNPJ de teste: válido, mas não existe na Receita.
insert into public.empresas (nome, atividade, criado_por, cnpj)
values ('Original da Ana', 'comercio', '11111111-1111-1111-1111-111111111111', '99999999000191');

set request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
insert into public.empresas (nome, atividade, criado_por, cnpj)
values ('Cópia do Bruno', 'comercio', '22222222-2222-2222-2222-222222222222', '99999999000191');

-- 7. Bruno tenta se marcar como verificado.
do $$
begin
  begin
    update public.empresas
       set verificada_em = now(), verificada_por = 'eu mesmo', verificacao_metodo = 'manual'
     where nome = 'Cópia do Bruno';
    insert into resultados values (7, 'FALHOU  7. usuário conseguiu se marcar como verificado');
  exception when insufficient_privilege then
    insert into resultados values (7, 'OK      7. usuário não consegue se verificar sozinho');
  end;
end;
$$;

reset role;

-- 6. O mesmo CNPJ pode estar em duas contas enquanto nenhuma for verificada.
insert into resultados
select 6, case when count(*) = 2
               then 'OK      6. mesmo CNPJ em duas contas não verificadas'
               else 'FALHOU  6. encontrei ' || count(*) || ' cadastros do CNPJ de teste' end
from public.empresas where cnpj = '99999999000191';

-- 8. A equipe verifica a empresa da Ana: a cópia do Bruno perde o CNPJ.
select public.verificar_empresa(
  (select id from public.empresas where nome = 'Original da Ana'), 'teste automático', 'manual');

insert into resultados
select 8, case when copia.cnpj is null and copia.cnpj_removido_em is not null
                and original.cnpj = '99999999000191' and original.verificada_em is not null
               then 'OK      8. ao verificar, a cópia perde o CNPJ e a original fica com ele'
               else 'FALHOU  8. a verificação não limpou a cópia' end
from public.empresas copia, public.empresas original
where copia.nome = 'Cópia do Bruno' and original.nome = 'Original da Ana';

-- 9. Depois disso, o Bruno não consegue usar o CNPJ de novo.
set role authenticated;
set request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
do $$
begin
  begin
    update public.empresas set cnpj = '99999999000191' where nome = 'Cópia do Bruno';
    insert into resultados values (9, 'FALHOU  9. o CNPJ verificado voltou para a cópia');
  exception when raise_exception then
    insert into resultados values (9, 'OK      9. CNPJ verificado não pode ser usado por outra conta');
  end;
end;
$$;
reset role;

-- 10. A Ana, dona da empresa verificada, não troca o CNPJ pelo app.
set role authenticated;
set request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
do $$
begin
  begin
    update public.empresas set cnpj = '11222333000181' where nome = 'Original da Ana';
    insert into resultados values (10, 'FALHOU 10. empresa verificada trocou de CNPJ');
  exception when insufficient_privilege then
    insert into resultados values (10, 'OK     10. empresa verificada não troca o CNPJ sozinha');
  end;
end;
$$;
reset role;

-- 11. Conversas da Lessy: pelo app, só leitura (o limite de perguntas depende disso).
set role authenticated;
set request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
do $$
begin
  begin
    insert into public.conversas (empresa_id, perfil_id)
    select id, '11111111-1111-1111-1111-111111111111' from public.empresas where nome = 'Padaria da Ana';
    insert into resultados values (11, 'FALHOU 11. usuário gravou conversa direto');
  exception when insufficient_privilege then
    insert into resultados values (11, 'OK     11. conversas e mensagens só o servidor grava');
  end;
end;
$$;
reset role;

-- 12. Missões: o Bruno não marca missão na empresa da Ana.
set role authenticated;
set request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
do $$
begin
  begin
    insert into public.missoes_feitas (empresa_id, perfil_id, missao)
    select id, '22222222-2222-2222-2222-222222222222', 'anexo' from alvo;
    insert into resultados values (12, 'FALHOU 12. Bruno marcou missão na empresa da Ana');
  exception when insufficient_privilege then
    insert into resultados values (12, 'OK     12. missões só na própria empresa');
  end;
end;
$$;
reset role;

-- ------------------------------------------------------------------ limpeza
reset role;
reset request.jwt.claims;

delete from public.conversas where empresa_id in (select id from public.empresas where nome in ('Padaria da Ana','Studio do Bruno','Original da Ana','Cópia do Bruno'));
delete from public.meses    where empresa_id in (select id from public.empresas where nome in ('Padaria da Ana','Studio do Bruno','Original da Ana','Cópia do Bruno'));
delete from public.membros  where empresa_id in (select id from public.empresas where nome in ('Padaria da Ana','Studio do Bruno','Original da Ana','Cópia do Bruno'));
delete from public.empresas where nome in ('Padaria da Ana','Studio do Bruno','Original da Ana','Cópia do Bruno');
delete from public.leads    where nome = 'Lead de teste';
delete from public.perfis   where id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');
delete from auth.users      where id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');

-- O resultado: as doze linhas precisam começar com OK.
select resultado from resultados order by ordem;
