/**
 * Casos-teste de sublimite e teto (pedido da revisão tributária).
 * Roda o motor com um histórico montado e imprime uma tabela para conferir à mão.
 *   npx tsx scripts/casos-limites.ts
 */
import { calcular, historico12, type MesLancado } from "../src/lib/tributario";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const pct = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(4).replace(".", ",")}%`);

type Caso = { nome: string; meses: MesLancado[]; alvos: { ano: number; mes: number }[] };

// Comércio (Anexo I). 2025: R$ 150 mil/mês (R$ 1,8 mi no ano).
// 2026: R$ 200 mil/mês de jan a ago (R$ 1,6 mi); setembro completa a RBA pedida; outubro R$ 100 mil.
function empresa(rbaAteSetembro: number): MesLancado[] {
  const m: MesLancado[] = [];
  for (let mes = 1; mes <= 12; mes++) m.push({ ano: 2025, mes, faturamento: 150_000, folha: 20_000 });
  for (let mes = 1; mes <= 8; mes++) m.push({ ano: 2026, mes, faturamento: 200_000, folha: 20_000 });
  m.push({ ano: 2026, mes: 9, faturamento: Math.round((rbaAteSetembro - 1_600_000) * 100) / 100, folha: 20_000 });
  m.push({ ano: 2026, mes: 10, faturamento: 100_000, folha: 20_000 });
  return m;
}

const casos: Caso[] = [3_600_000, 3_600_000.01, 4_320_000.01, 4_800_000.01, 5_760_000.01].map((rba) => ({
  nome: `RBA ${brl(rba)} em set/2026`,
  meses: empresa(rba),
  alvos: [
    { ano: 2026, mes: 9 },
    { ano: 2026, mes: 10 },
  ],
}));

// RBT12 de R$ 4.915.000 e RBA baixa em janeiro: 2025 somou 4.915.000; jan/2026 = R$ 300 mil.
const alto: MesLancado[] = [];
for (let mes = 1; mes <= 12; mes++) alto.push({ ano: 2025, mes, faturamento: mes === 12 ? 4_915_000 - 11 * 409_583 : 409_583, folha: 50_000 });
alto.push({ ano: 2026, mes: 1, faturamento: 300_000, folha: 50_000 });
casos.push({ nome: "RBT12 R$ 4.915.000, RBA baixa em jan/2026", meses: alto, alvos: [{ ano: 2026, mes: 1 }] });

for (const c of casos) {
  console.log(`\n### ${c.nome}\n`);
  console.log("| Mês | Receita do mês | RBT12 | Faixa | Alíq. efetiva | RBA (jan até o mês) | No Simples? | ICMS/ISS no DAS? | DAS | Avisos |");
  console.log("|---|---|---|---|---|---|---|---|---|---|");
  for (const a of c.alvos) {
    const m = c.meses.find((x) => x.ano === a.ano && x.mes === a.mes)!;
    const r = calcular({ atividade: "comercio", faturamento: m.faturamento, folha: m.folha, custos: 0 }, undefined, historico12(c.meses, m));
    const s = r.situacao;
    console.log(
      `| ${String(a.mes).padStart(2, "0")}/${a.ano} | ${brl(m.faturamento)} | ${brl(r.rbt12)} | ${r.faixa}ª | ${pct(r.aliquotaEfetiva)} | ${brl(s.receitaAno.rba)} | ${s.noSimples ? "sim" : "não"} | ${s.icmsIssNoDas ? "sim" : "não"} | ${brl(r.das)} | ${s.avisos.map((x) => x.titulo).join(" / ") || "—"} |`,
    );
  }
}
