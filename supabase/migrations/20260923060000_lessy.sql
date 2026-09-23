-- Lessy: conversas por pessoa e escrita só pelo servidor.
--
-- O limite de perguntas é contado nas mensagens. Se o usuário pudesse apagar
-- ou inventar mensagens pela API, zeraria o próprio limite (ou colocaria
-- respostas falsas na boca da Lessy). Por isso, pelo app, conversas e
-- mensagens passam a ser SÓ leitura; quem grava é o servidor, com a chave de
-- serviço, depois de conferir o login e o limite.

-- Quem perguntou: o limite é por pessoa, não por empresa.
alter table public.conversas
  add column if not exists perfil_id uuid references public.perfis (id) on delete set null;

create index if not exists conversas_perfil_idx on public.conversas (perfil_id, criada_em desc);
create index if not exists mensagens_criada_em_idx on public.mensagens (criada_em);

drop policy if exists conversa_membro on public.conversas;
drop policy if exists conversa_membro_ver on public.conversas;
create policy conversa_membro_ver on public.conversas
  for select using (public.e_membro(empresa_id));

drop policy if exists mensagem_membro on public.mensagens;
drop policy if exists mensagem_membro_ver on public.mensagens;
create policy mensagem_membro_ver on public.mensagens
  for select using (
    exists (select 1 from public.conversas c where c.id = conversa_id and public.e_membro(c.empresa_id))
  );
