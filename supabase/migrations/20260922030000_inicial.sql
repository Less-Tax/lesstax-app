-- Less Tax — WebApp: primeira migração.
-- Cria as tabelas, os índices e as políticas de segurança (RLS).
-- Regra do projeto: toda tabela nasce com RLS ligada. Sem política, ninguém lê.

-- ---------------------------------------------------------------------------
-- 1. Perfil: espelha auth.users, 1 para 1.
-- ---------------------------------------------------------------------------
create table if not exists public.perfis (
  id                 uuid primary key references auth.users (id) on delete cascade,
  nome               text,
  telefone           text,
  termos_aceitos_em  timestamptz,
  termos_versao      text,
  criado_em          timestamptz not null default now()
);

-- Todo usuário que se cadastra ganha um perfil automaticamente.
create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, new.raw_user_meta_data ->> 'nome')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

-- ---------------------------------------------------------------------------
-- 2. Empresa: dados da Receita + o que o usuário corrigiu.
-- ---------------------------------------------------------------------------
create table if not exists public.empresas (
  id               uuid primary key default gen_random_uuid(),
  cnpj             text unique,                      -- 14 dígitos, sem pontuação
  razao_social     text,
  nome_fantasia    text,
  nome             text not null,                    -- como aparece no app
  porte            text,                             -- ME, EPP, DEMAIS
  cnae_codigo      integer,
  cnae_descricao   text,
  regime           text,                             -- mei, simples, lucro_real, lucro_presumido
  municipio        text,
  uf               text,
  abertura         date,
  funcionarios     integer check (funcionarios is null or funcionarios >= 0),
  atividade        text not null check (atividade in ('comercio','industria','servicos','profissionais','obras')),
  clientes         text check (clientes in ('pf','pj','ambos')),
  criado_por       uuid references public.perfis (id),
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  constraint cnpj_14_digitos check (cnpj is null or cnpj ~ '^[0-9]{14}$')
);

-- ---------------------------------------------------------------------------
-- 3. Membros: quem enxerga qual empresa. É a tabela que a RLS consulta.
-- ---------------------------------------------------------------------------
create table if not exists public.membros (
  id          uuid primary key default gen_random_uuid(),
  perfil_id   uuid not null references public.perfis (id) on delete cascade,
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  papel       text not null default 'dono' check (papel in ('dono','contador','convidado')),
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  unique (perfil_id, empresa_id)
);

create index if not exists membros_perfil_idx  on public.membros (perfil_id);
create index if not exists membros_empresa_idx on public.membros (empresa_id);

-- Quem cria a empresa vira dono dela.
create or replace function public.criar_membro_dono()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.criado_por is not null then
    insert into public.membros (perfil_id, empresa_id, papel)
    values (new.criado_por, new.id, 'dono')
    on conflict (perfil_id, empresa_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists ao_criar_empresa on public.empresas;
create trigger ao_criar_empresa
  after insert on public.empresas
  for each row execute function public.criar_membro_dono();

-- ---------------------------------------------------------------------------
-- 4. Meses: um registro por empresa e competência.
--    Dinheiro em numeric, nunca em float.
-- ---------------------------------------------------------------------------
create table if not exists public.meses (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas (id) on delete cascade,
  ano            integer not null check (ano between 2000 and 2100),
  mes            integer not null check (mes between 1 and 12),
  faturamento    numeric(14,2) not null check (faturamento >= 0),
  folha          numeric(14,2) not null default 0 check (folha >= 0),
  custos         numeric(14,2) not null default 0 check (custos >= 0),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  unique (empresa_id, ano, mes)
);

create index if not exists meses_empresa_idx on public.meses (empresa_id, ano desc, mes desc);

-- ---------------------------------------------------------------------------
-- 5. Simulações: histórico imutável. Nunca recalcula o passado.
-- ---------------------------------------------------------------------------
create table if not exists public.simulacoes (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas (id) on delete cascade,
  entrada        jsonb not null,
  resultado      jsonb not null,
  regras_versao  text not null,          -- ex.: 'simples-2026'
  criada_em      timestamptz not null default now()
);

create index if not exists simulacoes_empresa_idx on public.simulacoes (empresa_id, criada_em desc);

-- ---------------------------------------------------------------------------
-- 6. Conversas com o Lessy.
-- ---------------------------------------------------------------------------
create table if not exists public.conversas (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  criada_em   timestamptz not null default now()
);

create index if not exists conversas_empresa_idx on public.conversas (empresa_id, criada_em desc);

create table if not exists public.mensagens (
  id              uuid primary key default gen_random_uuid(),
  conversa_id     uuid not null references public.conversas (id) on delete cascade,
  papel           text not null check (papel in ('user','assistant')),
  conteudo        text not null,
  tokens_entrada  integer,
  tokens_saida    integer,
  criada_em       timestamptz not null default now()
);

create index if not exists mensagens_conversa_idx on public.mensagens (conversa_id, criada_em);

-- ---------------------------------------------------------------------------
-- 7. Assinaturas: quem paga o quê. Escrita só pelo servidor.
-- ---------------------------------------------------------------------------
create table if not exists public.assinaturas (
  id           uuid primary key default gen_random_uuid(),
  perfil_id    uuid not null references public.perfis (id) on delete cascade,
  plano        text not null default 'gratuito' check (plano in ('gratuito','pago','assessoria')),
  status       text not null default 'ativa' check (status in ('ativa','cancelada','vencida')),
  valido_ate   date,
  criada_em    timestamptz not null default now()
);

create index if not exists assinaturas_perfil_idx on public.assinaturas (perfil_id);

-- ---------------------------------------------------------------------------
-- 8. Leads: mesma tabela do MVP. Em produção ela já existe e isto é no-op.
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id                bigint generated always as identity primary key,
  criado_em         timestamptz not null default now(),
  nome              text not null,
  whatsapp          text not null,
  whatsapp_digitos  text not null,
  empresa           text,
  atividade         text,
  faturamento_mes   numeric,
  consentimento     boolean not null default false,
  origem            text
);

create index if not exists leads_criado_em_idx on public.leads (criado_em desc);

-- ---------------------------------------------------------------------------
-- 9. Eventos: trilha de auditoria. Só o servidor escreve, ninguém lê pelo app.
-- ---------------------------------------------------------------------------
create table if not exists public.eventos (
  id          bigint generated always as identity primary key,
  perfil_id   uuid references public.perfis (id) on delete set null,
  empresa_id  uuid references public.empresas (id) on delete set null,
  acao        text not null,
  detalhe     jsonb,
  criado_em   timestamptz not null default now()
);

create index if not exists eventos_empresa_idx on public.eventos (empresa_id, criado_em desc);

-- ---------------------------------------------------------------------------
-- Atualiza atualizado_em sozinho.
-- ---------------------------------------------------------------------------
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists ao_atualizar_empresa on public.empresas;
create trigger ao_atualizar_empresa
  before update on public.empresas
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists ao_atualizar_mes on public.meses;
create trigger ao_atualizar_mes
  before update on public.meses
  for each row execute function public.tocar_atualizado_em();

-- ===========================================================================
-- SEGURANÇA
-- ===========================================================================

-- Função auxiliar: o usuário logado tem vínculo ativo com esta empresa?
-- security definer de propósito: evita que a política de membros consulte
-- membros de novo, o que daria recursão infinita.
create or replace function public.e_membro(p_empresa uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.membros m
    where m.empresa_id = p_empresa
      and m.perfil_id  = auth.uid()
      and m.ativo
  );
$$;

alter table public.perfis       enable row level security;
alter table public.empresas     enable row level security;
alter table public.membros      enable row level security;
alter table public.meses        enable row level security;
alter table public.simulacoes   enable row level security;
alter table public.conversas    enable row level security;
alter table public.mensagens    enable row level security;
alter table public.assinaturas  enable row level security;
alter table public.leads        enable row level security;
alter table public.eventos      enable row level security;

-- perfis: cada um vê e edita só o próprio.
drop policy if exists perfil_proprio_ver on public.perfis;
create policy perfil_proprio_ver on public.perfis
  for select using (id = auth.uid());

drop policy if exists perfil_proprio_editar on public.perfis;
create policy perfil_proprio_editar on public.perfis
  for update using (id = auth.uid()) with check (id = auth.uid());

-- empresas: só quem é membro. Criar exige estar logado e se declarar criador.
drop policy if exists empresa_membro_ver on public.empresas;
create policy empresa_membro_ver on public.empresas
  for select using (public.e_membro(id));

drop policy if exists empresa_criar on public.empresas;
create policy empresa_criar on public.empresas
  for insert with check (criado_por = auth.uid());

drop policy if exists empresa_membro_editar on public.empresas;
create policy empresa_membro_editar on public.empresas
  for update using (public.e_membro(id)) with check (public.e_membro(id));

-- membros: vê o próprio vínculo e os vínculos das empresas de que participa.
drop policy if exists membro_ver on public.membros;
create policy membro_ver on public.membros
  for select using (perfil_id = auth.uid() or public.e_membro(empresa_id));

-- meses, simulações e conversas: tudo preso ao vínculo com a empresa.
drop policy if exists mes_membro on public.meses;
create policy mes_membro on public.meses
  for all using (public.e_membro(empresa_id)) with check (public.e_membro(empresa_id));

drop policy if exists simulacao_membro_ver on public.simulacoes;
create policy simulacao_membro_ver on public.simulacoes
  for select using (public.e_membro(empresa_id));

drop policy if exists simulacao_membro_criar on public.simulacoes;
create policy simulacao_membro_criar on public.simulacoes
  for insert with check (public.e_membro(empresa_id));

drop policy if exists conversa_membro on public.conversas;
create policy conversa_membro on public.conversas
  for all using (public.e_membro(empresa_id)) with check (public.e_membro(empresa_id));

drop policy if exists mensagem_membro on public.mensagens;
create policy mensagem_membro on public.mensagens
  for all using (
    exists (select 1 from public.conversas c where c.id = conversa_id and public.e_membro(c.empresa_id))
  ) with check (
    exists (select 1 from public.conversas c where c.id = conversa_id and public.e_membro(c.empresa_id))
  );

-- assinaturas: o dono lê a própria; escrever, só o servidor.
drop policy if exists assinatura_propria_ver on public.assinaturas;
create policy assinatura_propria_ver on public.assinaturas
  for select using (perfil_id = auth.uid());

-- leads e eventos: nenhuma política, de propósito.
-- Ninguém lê nem grava com a chave pública; só a service_role, no servidor.
