-- Fração das vendas do mês em produtos monofásicos (bebidas, cosméticos,
-- remédios, autopeças, pneus). Só faz sentido para comércio; nos outros fica 0.
alter table public.meses
  add column if not exists monofasico numeric(3,2) not null default 0
    check (monofasico >= 0 and monofasico <= 1);
