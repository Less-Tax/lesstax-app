# Decisões técnicas

Uma entrada por decisão de peso, com a data e o motivo. Serve para o próximo dev
— inclusive você daqui a seis meses — entender por que as coisas são como são.

## 2026-09-22 — Next.js na Vercel + Supabase, um projeto só

Sem serviço separado para a API. Para a escala prevista (10 usuários no beta,
500 no horizonte), dois sistemas já seriam dois sistemas para manter.
O mesmo módulo de domínio serve o app mobile depois, pela mesma API.

## 2026-09-22 — Autorização no banco, com Row Level Security

Verificar permissão só no código do Next é o erro clássico: basta uma rota nova
esquecer o `if` e vaza tudo. A política pergunta à função `e_membro()` se o
usuário logado tem vínculo ativo com aquela empresa.

`e_membro()` é `security definer` de propósito: sem isso, a política da tabela
`membros` consultaria `membros` de novo e entraria em recursão infinita.

## 2026-09-22 — Usuário e empresa são muitos-para-muitos desde o início

No v1 quase todo mundo terá uma empresa só. Mas criar a tabela `membros` depois
significaria migrar dados de clientes reais; criar agora custa uma tabela.
É também o que permite o contador convidado, sem mudar nada no banco.

## 2026-09-22 — Tabelas do Simples versionadas por ano

Cada simulação guarda em `regras_versao` qual versão das regras usou, e
simulação não é recalculada. Sem isso, a reforma tributária de 2027 reescreveria
o histórico mostrado a todos os clientes.

## 2026-09-22 — Dois projetos Supabase em vez de branching

Branching cria um banco por pull request, cobrado por hora, sem cobertura do
teto de gastos, e nasce sem dados. Para um dev trabalhando sozinho, dois
projetos fixos (`lesstax-dev` e `lesstax-prod`) custam zero e guardam os dados
de teste. Reavaliar quando houver mais de uma pessoa abrindo PR.

## 2026-09-22 — shadcn/ui em vez de biblioteca pronta

Os componentes são copiados para dentro do repositório e viram código nosso.
O protótipo já tem identidade visual definida (verde, elefante, as cores de
imposto/folha/custo); com Material ou Chakra seria luta contra o tema deles.
Ressalva: os componentes não atravessam para React Native — o que atravessa são
os tokens de cor e espaçamento, por isso eles ficam num lugar só.

## 2026-09-22 — Limites do Lessy por conta, não por IP

No MVP a contagem era por sessão e por IP; trocar de navegador zerava o limite.
Agora: 3 perguntas por simulação no gratuito, teto mensal por conta no pago
(começando em 100) e o teto geral por dia como proteção de orçamento.
Nada na comunicação diz "ilimitado" — a primeira pessoa a bater no teto viraria
reclamação.

## 2026-09-22 — Repositório novo, MVP congelado

O protótipo em HTML continua no ar para captação até o beta fechado terminar, e
recebe só correção de bug. Do MVP migram o cálculo (reescrito em TS com testes),
a função de CNPJ, as instruções do Lessy e as cores. O `index.html` fica como
referência visual, não como código a portar.
