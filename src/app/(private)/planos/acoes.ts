"use server";

import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/usuario";
import { empresasDoUsuario } from "@/lib/db/empresas";
import { perfilAtual } from "@/lib/db/perfis";
import { clienteServico } from "@/lib/db/servico";

export type EstadoInteresse = { erro?: string; ok?: boolean };

/**
 * Enquanto não há cobrança automática, "Quero o Premium" registra o interesse
 * na trilha de eventos (aparece no painel admin) e a equipe ativa na mão.
 */
export async function quererPremium(): Promise<EstadoInteresse> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");
  const [empresa] = await empresasDoUsuario();

  try {
    const db = clienteServico();
    // Um pedido por pessoa a cada 7 dias basta: evita encher o painel com cliques repetidos.
    const semana = new Date(Date.now() - 7 * 864e5).toISOString();
    const { count } = await db
      .from("eventos")
      .select("id", { count: "exact", head: true })
      .eq("perfil_id", usuario.id)
      .eq("acao", "interesse_premium")
      .gte("criado_em", semana);
    if ((count ?? 0) === 0) {
      const perfil = await perfilAtual();
      const { error } = await db.from("eventos").insert({
        perfil_id: usuario.id,
        empresa_id: empresa?.id ?? null,
        acao: "interesse_premium",
        detalhe: { nome: perfil?.nome ?? null, email: usuario.email ?? null, telefone: perfil?.telefone ?? null },
      });
      if (error) throw new Error(error.message);
    }
  } catch (erro) {
    console.error("[planos] interesse:", erro);
    return { erro: "Não consegui registrar agora. Tente de novo em instantes." };
  }
  return { ok: true };
}
