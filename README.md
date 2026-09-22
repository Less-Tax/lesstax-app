# Less Tax — WebApp

Plataforma que ajuda pequenos e médios empresários a entender seus impostos e
aumentar o lucro, em linguagem simples. Esta é a versão com contas de usuário,
que substitui o protótipo em HTML (`Projeto SW/MVP`, congelado).

## Stack

| Camada | Escolha |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript strict |
| Estilo | Tailwind CSS v4 + shadcn/ui |
| Banco, auth e storage | Supabase (Postgres com RLS) |
| Hospedagem | Vercel |
| IA (Lessy) | API do Claude |
| Formulários | react-hook-form + Zod |
| Gráficos | Recharts |

## Ambientes

| Ambiente | Banco |
|---|---|
| Local (`npm run dev`) | `lesstax-dev` |
| Preview (branch na Vercel) | `lesstax-dev` |
| Produção (`main`) | `lesstax-prod` |

## Começando

```bash
npm install
cp .env.local.example .env.local   # preencha com as chaves do lesstax-dev
npm run dev
```

## Banco de dados

Toda mudança de schema é um arquivo em `supabase/migrations`. Nunca altere
tabela pelo painel do Supabase: o que não está aqui não existe em produção.

```bash
npx supabase link --project-ref <ref do lesstax-dev>
npx supabase db push
```

Depois de aplicar a migração, rode `supabase/tests/teste_rls.sql` no SQL Editor.
As cinco verificações precisam responder OK — é o teste que garante que um
cliente não enxerga os dados de outro.

## Estrutura

```
src/
├─ app/
│  ├─ (public)/     sem login: landing, entrar, cadastrar
│  ├─ (private)/    layout exige sessão: raio-x, meses, lessy, missões
│  └─ api/          rotas de servidor: cnpj, lessy, webhooks
├─ components/      ui/ (shadcn) e componentes do produto
├─ lib/
│  ├─ tributario/   cálculo puro do Simples, sem banco e sem rede
│  ├─ db/           único lugar que fala com o Supabase
│  ├─ integracoes/  BrasilAPI, Claude
│  ├─ auth/         sessão e papéis
│  └─ validacao/    schemas Zod, usados na tela e no servidor
└─ types/
supabase/
├─ migrations/      schema versionado
└─ tests/           teste da RLS
```

Os parênteses são grupos de rota do Next: não entram na URL. `(private)/raio-x`
responde em `/raio-x`.

## Regras que não se negociam

1. Nada em `app/` importa o Supabase direto — passa por `lib/db/`.
2. `lib/tributario/` não importa nada. É o que permite testar e reusar no mobile.
3. Toda tabela nasce com RLS ligada. Sem política, ninguém lê.
4. Dinheiro em `numeric`, nunca em `float`.
5. `simulacoes` não é recalculada: regra nova gera simulação nova.
6. Segredo só em variável de ambiente. `SUPABASE_SERVICE_ROLE_KEY` nunca no cliente.

## Commits

Padrão [Conventional Commits](https://www.conventionalcommits.org), com a
descrição em português e no imperativo:

| Prefixo | Quando usar |
|---|---|
| `feat:` | função nova |
| `fix:` | correção de bug |
| `refactor:` | mudança sem alterar comportamento |
| `docs:` | documentação |
| `chore:` | build, dependências, configuração |
| `test:` | testes |

A primeira linha para em 72 caracteres — é o que o GitHub mostra sem cortar.
O detalhe vai no corpo do commit, depois de uma linha em branco.

```
feat: autenticação com Supabase e telas de conta

Login, cadastro e recuperação de senha. A sessão é verificada no layout
de (private), em um lugar só.
```

As decisões técnicas e o porquê de cada uma estão em [DECISOES.md](./DECISOES.md).
