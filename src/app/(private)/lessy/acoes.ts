"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { usuarioAtual } from "@/lib/auth/usuario";
import { empresasDoUsuario } from "@/lib/db/empresas";
import { mesesDaEmpresa } from "@/lib/db/meses";
import { simulacoesPorMes } from "@/lib/db/simulacoes";
import { contextoEmpresa, historicoParaApi, instrucoes } from "@/lib/lessy/contexto";
import { esquemaPergunta, limiteDiario, limiteMensal } from "@/lib/lessy/limites";
import {
  conversaDoUsuario,
  gravarTroca,
  mensagensDa,
  perguntarAoClaude,
  planoDe,
  usoDoDia,
  usoDoMes,
} from "@/lib/lessy/servidor";

export type RespostaLessy =
  | { ok: true; resposta: string; conversaId: string; restantes: number }
  | { ok: false; erro: string; restantes?: number };

const FALHA = "O Lessy não conseguiu responder agora. Tente de novo em instantes — a pergunta não foi descontada.";

export async function perguntar(conversaIdPedido: string | null, texto: string): Promise<RespostaLessy> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");
  const [empresa] = await empresasDoUsuario();
  if (!empresa) redirect("/empresa/nova");

  const lida = esquemaPergunta.safeParse(texto);
  if (!lida.success) return { ok: false, erro: lida.error.issues[0].message };
  const pergunta = lida.data;

  try {
    const agora = new Date();

    // 1. Limites: o da pessoa no mês e o geral do dia.
    const [plano, usadas, doDia] = await Promise.all([planoDe(usuario.id, agora), usoDoMes(usuario.id, agora), usoDoDia(agora)]);
    const limite = limiteMensal(plano);
    if (usadas >= limite) {
      return {
        ok: false,
        restantes: 0,
        erro:
          plano === "gratuito"
            ? `Você já usou as ${limite} perguntas grátis deste mês. No mês que vem tem mais — e um especialista da Less Tax pode ajudar com o resto.`
            : "Você chegou ao limite de perguntas deste mês.",
      };
    }
    if (doDia >= limiteDiario()) {
      return { ok: false, restantes: limite - usadas, erro: "O Lessy está com muita procura hoje. Tente de novo amanhã." };
    }

    // 2. A conversa, se veio, tem de ser desta pessoa e desta empresa.
    let conversaId: string | null = null;
    if (conversaIdPedido) {
      const id = z.uuid().safeParse(conversaIdPedido);
      conversaId = id.success ? await conversaDoUsuario(id.data, empresa.id, usuario.id) : null;
    }
    const historico = conversaId ? historicoParaApi(await mensagensDa(conversaId)) : [];

    // 3. Os números da empresa, lidos do banco — nunca do navegador.
    const [meses, simulacoes] = await Promise.all([mesesDaEmpresa(empresa.id), simulacoesPorMes(empresa.id)]);
    const porMes = new Map(simulacoes.map((s) => [`${s.entrada.ano}-${s.entrada.mes}`, s.resultado]));
    const dados = contextoEmpresa(
      empresa,
      meses.map((m) => ({ ...m, resultado: porMes.get(`${m.ano}-${m.mes}`) ?? null })),
    );

    // 4. A pergunta vai para a API.
    const r = await perguntarAoClaude(`${instrucoes(agora)}\n\n${dados}`, [...historico, { role: "user", content: pergunta }]);
    if (!r.ok) {
      return {
        ok: false,
        restantes: limite - usadas,
        erro: r.motivo === "sem_chave" ? "O Lessy ainda não foi configurado no servidor (falta a ANTHROPIC_API_KEY)." : FALHA,
      };
    }

    // 5. Só agora a pergunta conta.
    const id = await gravarTroca({
      conversaId,
      empresaId: empresa.id,
      perfilId: usuario.id,
      pergunta,
      resposta: r.texto,
      tokensEntrada: r.tokensEntrada,
      tokensSaida: r.tokensSaida,
    });
    return { ok: true, resposta: r.texto, conversaId: id, restantes: Math.max(0, limite - usadas - 1) };
  } catch (erro) {
    console.error(erro);
    return { ok: false, erro: FALHA };
  }
}
