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

## 2026-09-22 — Conventional Commits

O histórico usa `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` e `test:`, com a
descrição em português e no imperativo, primeira linha até 72 caracteres.
Além de deixar o histórico legível, o prefixo permite gerar changelog e versão
automaticamente quando o projeto precisar disso.

## 2026-09-22 — "Manter conectado" por 30 dias, com opção de desligar

Os cookies de sessão nasciam sem prazo, então morriam ao fechar o navegador.
Agora o prazo é decidido por um cookie próprio (`lt_lembrar`): padrão de 30
dias, e quem desmarcar a caixa no login recebe cookie de sessão, que some ao
fechar o navegador — o caso de computador emprestado ou compartilhado.

O prazo é aplicado nos dois lugares que gravam cookie (`lib/db/servidor.ts` e
`lib/db/sessao.ts`), porque o proxy regrava os cookies a cada renovação e
desfaria o prazo se soubesse só um deles.

## 2026-09-22 — Empresa é criada sem pedir a linha de volta

`supabase.from("empresas").insert(...).select()` falha com erro de RLS: no
momento do insert a pessoa ainda não é membro da empresa (o vínculo é criado
pelo gatilho logo depois), então a política de leitura recusa devolver a linha.
Por isso o id é gerado no servidor com `crypto.randomUUID()` e o insert não
usa `.select()`. Testado no Postgres: com `returning` falha, sem ele funciona.

## 2026-09-22 — Dados da Receita nunca vêm do navegador

A tela mostra o resultado da consulta de CNPJ, mas ao salvar o servidor consulta
de novo (sai do cache) em vez de aceitar razão social, porte ou regime enviados
pelo formulário — que qualquer um poderia forjar. Do navegador vêm só o CNPJ e o
que a pessoa digita.

## 2026-09-22 — Empresa verificada e CNPJ único só entre as verificadas

Com CNPJ único para todos, quem cadastrasse o CNPJ de outra empresa primeiro
trancaria o dono de verdade para fora. Agora qualquer conta cadastra qualquer
CNPJ, sempre como não verificada, e o CNPJ só é único entre as verificadas
(índice único parcial). Os números de uma empresa não verificada são só os que
a própria conta digitou, então uma cópia não expõe nada do dono.

A verificação é feita pela equipe — manual no beta, conferindo um documento que
não seja público (contrato social + documento do sócio; o cartão CNPJ não
serve). Pelo SQL Editor do Supabase:

    select public.verificar_empresa('<id da empresa>', '<quem verificou>', 'manual');

Um gatilho impede que o usuário do app mexa nos campos de verificação, e a
função não pode ser chamada pela API. Os métodos `cpf` e `pix` entram depois e
preenchem as mesmas colunas.

Efeito colateral bom: a mensagem "CNPJ já cadastrado", que revelava quem é
cliente, deixou de existir.

## 2026-09-22 — Cópias perdem o CNPJ quando a original é verificada

`verificar_empresa()` remove o CNPJ (e os dados da Receita ligados a ele) das
outras contas que tinham cadastrado o mesmo número, e marca `cnpj_removido_em`
para o app avisar essas contas. Os números que elas lançaram continuam salvos.
Depois da verificação, um gatilho impede qualquer outra empresa de usar esse
CNPJ, no cadastro ou numa edição.

Nunca juntamos a cópia na empresa verificada: o impostor ganharia acesso aos
dados do dono. Entrar numa empresa verificada só por convite.

Preço consciente: quem tenta cadastrar um CNPJ verificado descobre que ele é
cliente da Less Tax. Aceito no beta, porque sem essa mensagem o sócio legítimo
não saberia que precisa pedir convite.
