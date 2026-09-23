-- Missões: o que a empresa já marcou como feito.
--
-- A maioria das missões é calculada a partir dos dados (mês lançado, pergunta
-- ao Lessy...). Esta tabela guarda só as que dependem de a pessoa dizer
-- "já fiz" (ex.: "decidi entre DAS e Simples híbrido").
-- `referencia` separa missões que voltam: 'sempre' vale para sempre;
-- '2027-1' vale para a escolha da reforma do 1º semestre de 2027.

create table if not exists public.missoes_feitas (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  perfil_id   uuid references public.perfis (id) on delete set null,
  missao      text not null check (missao ~ '^[a-z0-9_]{2,40}$'),
  referencia  text not null default 'sempre' check (referencia ~ '^[a-z0-9_-]{1,20}$'),
  feita_em    timestamptz not null default now(),
  unique (empresa_id, missao, referencia)
);

alter table public.missoes_feitas enable row level security;

-- Membro vê e marca as missões da própria empresa. Desmarcar não existe.
drop policy if exists missao_membro_ver on public.missoes_feitas;
create policy missao_membro_ver on public.missoes_feitas
  for select using (public.e_membro(empresa_id));

drop policy if exists missao_membro_marcar on public.missoes_feitas;
create policy missao_membro_marcar on public.missoes_feitas
  for insert with check (public.e_membro(empresa_id) and perfil_id = auth.uid());
