"use server";

import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/usuario";
import { empresasDoUsuario } from "@/lib/db/empresas";
import { salvarMes } from "@/lib/db/meses";
import { registrarSimulacao } from "@/lib/db/simulacoes";
import { calcular, type Atividade } from "@/lib/tributario";
import { esquemaMes } from "@/lib/validacao/mes";

export type EstadoMes = { erro?: string };

const ATIVIDADES: Atividade[] = ["comercio", "industria", "servicos", "profissionais", "obras"];

export async function lancarMes(_anterior: EstadoMes, dados: FormData): Promise<EstadoMes> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");

  const [empresa] = await empresasDoUsuario();
  if (!empresa) redirect("/empresa/nova");

  const lido = esquemaMes.safeParse({
    ano: dados.get("ano"),
    mes: dados.get("mes"),
    faturamento: dados.get("faturamento"),
    folha: dados.get("folha"),
    custos: dados.get("custos"),
    monofasico: dados.get("monofasico") || 0,
  });
  if (!lido.success) return { erro: lido.error.issues[0].message };

  const atividade = empresa.atividade as Atividade;
  if (!ATIVIDADES.includes(atividade)) return { erro: "A atividade da empresa está inválida." };

  const d = lido.data;
  // Monofásico só existe no comércio; nos outros ramos grava zero.
  const monofasico = atividade === "comercio" ? d.monofasico : 0;

  try {
    await salvarMes(empresa.id, { ...d, monofasico });
    const entrada = { atividade, faturamento: d.faturamento, folha: d.folha, custos: d.custos, monofasico };
    await registrarSimulacao(empresa.id, { ...entrada, ano: d.ano, mes: d.mes }, calcular(entrada));
  } catch (erro) {
    console.error(erro);
    return { erro: "Não consegui salvar agora. Tente de novo em instantes." };
  }

  redirect("/raio-x");
}
