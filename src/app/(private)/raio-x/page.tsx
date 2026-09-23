import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, ChevronRight } from "lucide-react";
import { Passos } from "@/components/boas-vindas/passos";
import { SeloVerificada } from "@/components/empresa/selo";
import { SeletorMes } from "@/components/navegacao/seletor-mes";
import { Cartao } from "@/components/raiox/cartao";
import { Numero, Principal } from "@/components/raiox/destaques";
import { Evolucao, type PontoEvolucao } from "@/components/raiox/evolucao";
import { Receita12 } from "@/components/raiox/receita-12";
import { AvisosLimite } from "@/components/raiox/avisos";
import { RoscaRaioX } from "@/components/raiox/rosca";
import { chave, lerChave, mesAtual, somar } from "@/lib/competencia";
import { empresasDoUsuario } from "@/lib/db/empresas";
import { usuarioAtual } from "@/lib/auth/usuario";
import {
  ehPremium,
  mesesLiberados,
  RELATORIOS_GRATIS,
} from "@/lib/planos/regras";
import { planoDe } from "@/lib/planos/servidor";
import { BloqueioPremium } from "@/components/planos/bloqueio";
import { simulacoesPorMes } from "@/lib/db/simulacoes";
import { competencia, nomeDoMes, porcento } from "@/lib/formato";
import { mesesQueFaltam, oportunidades, rotuloRegime } from "@/lib/tributario";
import { Anel } from "@/components/missoes/anel";
import { nivel, saude } from "@/lib/missoes/regras";
import { missoesDa } from "@/lib/missoes/servidor";

export const metadata = { title: "Raio-X — Less Tax" };

const curto = (ano: number, mes: number) =>
  `${nomeDoMes(mes).slice(0, 3)}/${String(ano).slice(2)}`;

export default async function RaioX({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; primeiro?: string }>;
}) {
  const [usuario, [empresa]] = await Promise.all([
    usuarioAtual(),
    empresasDoUsuario(),
  ]);
  if (!usuario) redirect("/entrar");
  if (!empresa) redirect("/empresa/nova");

  // Uma simulação por mês lançado, do mais antigo para o mais novo.
  // O Raio-X mostra o que foi calculado e guardado — não recalcula.
  const [simulacoes, listaMissoes, plano] = await Promise.all([
    simulacoesPorMes(empresa.id),
    missoesDa(empresa),
    planoDe(usuario.id),
  ]);
  const premium = ehPremium(plano);
  const pontosSaude = saude(listaMissoes);
  const missoesPendentes = listaMissoes.filter((m) => !m.feita).length;
  if (simulacoes.length === 0) redirect("/meses");

  const parametros = await searchParams;
  const pedido = lerChave(parametros.mes);
  const indice = pedido
    ? simulacoes.findIndex((s) => chave(s.entrada) === chave(pedido))
    : -1;
  const i = indice >= 0 ? indice : simulacoes.length - 1;

  const { entrada, resultado } = simulacoes[i];
  const anterior = simulacoes[i - 1] ?? null;
  const proximo = simulacoes[i + 1] ?? null;
  const mesAntes = anterior ? nomeDoMes(anterior.entrada.mes) : "";
  // Comparar com o mês anterior faz parte do dashboard melhorado (Premium).
  const antes = (f: (s: (typeof simulacoes)[number]) => number) =>
    premium && anterior ? { valor: f(anterior), mes: mesAntes } : null;
  const liberado = mesesLiberados(
    plano,
    simulacoes.map((s) => chave(s.entrada)),
  ).has(chave(entrada));

  const cartoes = oportunidades({
    entrada,
    resultado,
    clientes: (empresa.clientes as "pf" | "pj" | "ambos" | null) ?? null,
    regime: empresa.regime,
    hoje: new Date(),
  });

  const pontos: PontoEvolucao[] = simulacoes.slice(-12).map((s) => ({
    chave: chave(s.entrada),
    rotulo: curto(s.entrada.ano, s.entrada.mes),
    nomeCompleto: competencia(s.entrada.ano, s.entrada.mes),
    imposto: s.resultado.imposto,
    lucro: s.resultado.lucro,
    escolhido: s === simulacoes[i],
  }));

  const aliquota = resultado.imposto / entrada.faturamento;
  const lancados = simulacoes.map((s) => ({ ...s.entrada }));
  const nomeMes = nomeDoMes(entrada.mes);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      {/* Empresa e mês */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-display text-2xl leading-tight font-bold">
            {empresa.nome}
            {empresa.verificada_em ? <SeloVerificada /> : null}
          </h1>
          <p className="text-sm text-muted-foreground">
            {rotuloRegime(resultado)}
          </p>
        </div>
        <SeletorMes
          rotulo={competencia(entrada.ano, entrada.mes)}
          calendario={{
            atual: entrada,
            lancados: simulacoes.map((s) => chave(s.entrada)),
            limite: mesAtual(),
            base: "/raio-x",
            somenteLancados: true,
          }}
          anterior={
            anterior
              ? {
                  href: `/raio-x?mes=${chave(anterior.entrada)}`,
                  rotulo: competencia(
                    anterior.entrada.ano,
                    anterior.entrada.mes,
                  ),
                }
              : null
          }
          proximo={
            proximo
              ? {
                  href: `/raio-x?mes=${chave(proximo.entrada)}`,
                  rotulo: competencia(proximo.entrada.ano, proximo.entrada.mes),
                }
              : null
          }
        />
      </div>

      {parametros.primeiro && simulacoes.length === 1 ? (
        <section
          aria-labelledby="titulo-primeiro"
          className="flex flex-col gap-4 rounded-2xl border border-primary/40 bg-primary-soft p-4 sm:p-5"
        >
          <Passos atual={3} />
          <div>
            <h2 id="titulo-primeiro" className="font-display text-xl font-bold">
              Seu primeiro Raio-X está pronto
            </h2>
            <p className="text-sm">
              Com um mês só, a receita de 12 meses é estimada. Cada mês anterior
              que você lançar deixa a conta mais perto da que a Receita faz.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/meses?mes=${chave(somar(entrada, -1))}`}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Lançar {nomeDoMes(somar(entrada, -1).mes)}
            </Link>
            <Link
              href="/lessy"
              className="rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary"
            >
              Perguntar ao Lessy
            </Link>
          </div>
        </section>
      ) : null}

      {empresa.cnpj_removido_em && !empresa.cnpj ? (
        <div
          role="status"
          className="rounded-2xl border-l-4 border-l-imposto bg-imposto-soft p-4 text-sm"
        >
          <p className="font-semibold">O CNPJ foi removido desta empresa</p>
          <p>
            Outra conta confirmou ser a dona desse CNPJ. Os números que você
            lançou continuam salvos. Se você faz parte da empresa, peça ao
            responsável para convidar você.
          </p>
        </div>
      ) : null}

      {liberado && resultado.situacao ? <AvisosLimite avisos={resultado.situacao.avisos} /> : null}

      {!liberado ? (
        <BloqueioPremium
          titulo={`O Raio-X de ${competencia(entrada.ano, entrada.mes).toLowerCase()} é do Premium`}
          texto={`No plano gratuito você vê o Raio-X dos ${RELATORIOS_GRATIS} meses mais recentes. Os outros meses continuam salvos e aparecem quando você assinar.`}
        />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
          {/* Coluna principal: os números e a evolução */}
          <div className="flex flex-col gap-4">
            <Principal
              rotulo={`Imposto de ${nomeMes}`}
              valor={resultado.imposto}
              apoio={
                resultado.foraDoSimples
                  ? "Referência: pela receita do ano, a empresa já saiu do Simples."
                  : `${porcento(aliquota)} de tudo que entrou${resultado.icmsIssFora ? ", sem o ICMS/ISS (pago à parte)" : ""}`
              }
              antes={antes((s) => s.resultado.imposto)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Numero
                rotulo="Entrou"
                valor={entrada.faturamento}
                antes={antes((s) => s.entrada.faturamento)}
              />
              <Numero
                rotulo={resultado.lucro < 0 ? "Prejuízo" : "Lucro"}
                valor={resultado.lucro}
                antes={antes((s) => s.resultado.lucro)}
                negativoEmDestaque
              />
            </div>

            <Link
              href="/missoes"
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary"
            >
              <Anel pontos={pontosSaude} tamanho={56} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">
                  Saúde tributária
                </p>
                <p className="font-semibold">
                  {nivel(pontosSaude)}
                  <span className="font-normal text-muted-foreground">
                    {missoesPendentes === 0
                      ? " · todas as missões feitas"
                      : ` · ${missoesPendentes} ${missoesPendentes === 1 ? "missão pendente" : "missões pendentes"}`}
                  </span>
                </p>
              </div>
              <ChevronRight
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </Link>

            <Receita12
              rbt12={resultado.rbt12}
              origem={resultado.origemRbt12}
              mes={entrada.mes}
              proximoParaLancar={mesesQueFaltam(lancados, entrada)[0] ?? null}
            />

            <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
              <h2 className="font-display text-lg font-bold">Mês a mês</h2>
              {!premium ? (
                <BloqueioPremium
                  titulo="Veja a evolução mês a mês"
                  texto="Imposto e lucro lado a lado nos últimos 12 meses, para ver se estão subindo ou caindo."
                />
              ) : pontos.length >= 2 ? (
                <Evolucao pontos={pontos} />
              ) : (
                <div className="flex flex-col items-start gap-3 py-2 text-sm text-muted-foreground">
                  <p>
                    Lance pelo menos mais um mês para ver se o imposto e o lucro
                    estão subindo ou caindo.
                  </p>
                  <Link
                    href="/meses"
                    className="flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 font-semibold text-primary"
                  >
                    <CalendarPlus className="size-4" aria-hidden="true" />
                    Lançar outro mês
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Coluna lateral: para onde vai o dinheiro e o que olhar */}
          <div className="flex flex-col gap-4">
            <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <RoscaRaioX
                key={chave(entrada)}
                entrada={entrada}
                resultado={resultado}
                nomeMes={nomeMes}
              />
            </section>

            {cartoes.length > 0 ? (
              <section className="flex flex-col gap-3">
                <h2 className="font-display text-lg font-bold">
                  O que olhar agora
                </h2>
                {cartoes.map((c) => (
                  <Cartao key={c.id} cartao={c} />
                ))}
              </section>
            ) : null}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Estimativas com as tabelas do Simples Nacional ({resultado.regrasVersao}
        ). Não substituem a análise de um contador.
      </p>
    </main>
  );
}
