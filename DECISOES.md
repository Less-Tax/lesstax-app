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

## 2026-09-22 — O Raio-X mostra a simulação guardada, não recalcula

Ao lançar um mês, o servidor calcula e grava a simulação (`simulacoes`), e o
Raio-X lê a última gravada. Se as tabelas mudarem, o cliente continua vendo o
número que viu da primeira vez; um mês relançado gera uma simulação nova.

As oportunidades (Fator R, reforma, monofásicos, INSS do Anexo IV, sublimite)
ficam em `lib/tributario/oportunidades.ts`, puras e testadas. A tela só desenha.

As cores do protótipo viraram tokens em `globals.css`, já com os nomes do
shadcn/ui (background, primary, border...). A instalação do shadcn fica para um
passo separado, rodado no Windows: o CLI instala pacotes, e instalar pelo Linux
trocaria os binários nativos do `node_modules`.

## 2026-09-22 — Abas Raio-X e Meses, estilo app de banco

O app ganhou duas abas: **Raio-X** (ler) e **Meses** (lançar e corrigir). No
celular ficam presas embaixo; no computador sobem para o cabeçalho.

- Meses: `/meses?mes=2026-08`. Setas navegam mês a mês (até o mês corrente),
  o formulário já vem preenchido se o mês foi lançado, e a lista ao lado mostra
  todos os lançados. Depois de salvar, oferece "Ver o Raio-X" e "Lançar o mês
  anterior" — o caminho mais rápido para preencher o histórico.
- Raio-X: `/raio-x?mes=2026-08`. Setas andam só entre meses lançados. No topo,
  o imposto do mês em destaque e a comparação com o mês lançado anterior;
  embaixo, o gráfico de imposto e lucro dos últimos 12 meses (clicar numa
  coluna abre aquele mês) e uma tabela com os mesmos números.

As cores do gráfico são vizinhas das da marca, ajustadas no validador de
paletas: as originais falhavam em saturação (daltonismo) e em contraste com o
fundo branco. Ficam em `--grafico-imposto` e `--grafico-lucro`.

## 2026-09-22 — Rosca no lugar da barra, com lente de R$ 100 ou R$ 1.000

"De cada R$ 100" virou uma rosca com o imposto no centro. A lente padrão vem do
porte: Microempresa (até R$ 360 mil por ano, art. 3º da LC 123) vê de cada
R$ 100; acima disso, de cada R$ 1.000 — onde as fatias pequenas deixam de
virar zero. A pessoa troca entre R$ 100, R$ 1.000 e o valor real do mês.

As partes são repartidas pelo método do maior resto, para somar a base exata
(sem isso, "de cada R$ 1.000" dava R$ 999).

Com prejuízo, as partes passam de 100% do que entrou e não cabem numa rosca de
"cada R$ 100": a rosca passa a mostrar para onde foram as saídas, em reais, com
o prejuízo no centro.

Cores da rosca validadas para daltonismo e contraste: o cinza do custo e o azul
da folha falhavam; o custo virou violeta (`--grafico-custo`) e a folha, um azul
mais forte (`--grafico-folha`).

## 2026-09-22 — A rosca fica só em reais do mês

A lente de R$ 100/R$ 1.000 pelo porte foi retirada no mesmo dia: o valor real do
mês ("dos R$ 100.000 de agosto") é o que o empresário entende de primeira, e a
porcentagem já aparece ao lado de cada parte. A caixinha que aparecia ao passar
o mouse tapava o número do meio; agora passar o mouse numa fatia ou na legenda
troca o próprio número do meio.

## 2026-09-23 — Receita de 12 meses (RBT12) pelo histórico lançado

A faixa da tabela e o Fator R passam a usar os 12 meses ANTERIORES ao mês
calculado, como a Receita faz — antes era o próprio mês × 12, que errava muito
em empresa com meses fortes e fracos.

- 12 meses lançados: soma exata.
- Parte deles: média dos lançados × 12 (é também a regra da LC 123, art. 18,
  § 2º, para empresa com menos de 12 meses).
- Nenhum anterior: o próprio mês × 12.

O resultado guarda `origemRbt12`, e o Raio-X avisa quando é estimativa e qual
mês lançar para chegar no valor exato.

Como cada mês depende dos 12 anteriores, salvar um mês recalcula ele e os 12
seguintes que já existirem — cada um ganha uma simulação nova; as antigas
continuam como foram mostradas.

## 2026-09-23 — Tela Conta: editar empresa, dados e senha

- A empresa editada é sempre a do usuário, lida no servidor. O formulário não
  manda id.
- Empresa verificada não troca o CNPJ: a tela trava o campo e o banco barra
  (`proteger_verificacao`). Só a equipe troca.
- CNPJ igual ao salvo mantém os dados da Receita. CNPJ novo consulta de novo
  no servidor; CNPJ apagado limpa esses dados.
- Mudar a atividade muda o anexo do Simples, então todos os meses lançados
  ganham uma simulação nova.
- Trocar a senha pede a senha atual. E-mail não se troca pelo app por
  enquanto: depende do envio de e-mails (limite de 2 por hora sem SMTP).

## 2026-09-23 — Painel admin

- Quem entra: e-mail confirmado e listado em `ADMIN_EMAILS`. A lista fica no
  servidor, fora do banco: quem conseguisse escrever no banco não vira admin.
- Quem não é admin recebe 404 — o painel não aparece para ninguém.
- O layout confere e cada Server Action confere de novo, porque uma ação pode
  ser chamada direto, sem passar pela tela.
- O painel lê com a chave de serviço (ignora a RLS), num módulo `server-only`
  que só roda depois da checagem.
- Verificar e desfazer ficam registrados em `eventos` (quem, quando, método).
- Desfazer não devolve o CNPJ às cópias que o perderam.

## 2026-09-23 — Lessy no app

- Limite por pessoa e por mês (horário de Brasília): 3 no gratuito, 100 no
  pago (`LESSY_MAX_GRATUITO`, `LESSY_MAX_MES_PAGO`), mais um teto geral por dia
  (`LESSY_MAX_DIA`, 50 por dia no começo) para proteger o orçamento da API.
- A pergunta só conta depois de respondida: pergunta e resposta são gravadas
  juntas. Falha da API não gasta pergunta.
- Conversas e mensagens: pelo app, só leitura. Quem grava é o servidor, com a
  chave de serviço. Sem isso, o usuário apagaria mensagens para zerar o limite.
- Os números da empresa e o histórico vão para a API a partir do banco — nunca
  do navegador. O texto digitado (nome da empresa, cidade) é limpo e vai dentro
  de `<dados_empresa>`, e as instruções mandam tratar isso como informação,
  nunca como ordem (defesa contra prompt injection).
- A Lessy não tem ferramentas: só lê o que mandamos e responde texto. Não
  grava nada nem consulta outras empresas.
- A resposta é mostrada como texto puro (sem HTML), então não abre porta
  para XSS.

## 2026-09-23 — Missões

- A maioria das missões é calculada pelos dados (mês lançado, 12 meses
  completos, pergunta ao Lessy). Só o que depende de a pessoa dizer "já fiz"
  fica gravado em `missoes_feitas`.
- A missão do mês volta todo mês; a da reforma só aparece enquanto a janela
  de escolha está aberta.
- Saúde tributária = % de missões feitas (0 a 100), com a mesma escala de cor
  do MVP.
- "Pedir contato" com especialista vira um evento que aparece no painel admin
  com nome, e-mail e celular.
- Os links "Perguntar ao Lessy" só preenchem a caixa: a pessoa decide enviar,
  para não gastar pergunta sem querer.
