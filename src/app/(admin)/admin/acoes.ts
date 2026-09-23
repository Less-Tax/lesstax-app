"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin/acesso";
import { ativarPremium, desativarPremium, desfazerVerificacao, verificarEmpresa } from "@/lib/admin/dados";

export type EstadoAdmin = { erro?: string; ok?: string };

const esquemaVerificar = z.object({
  empresa: z.uuid(),
  metodo: z.enum(["manual", "cpf", "pix"]),
});

/** Toda ação do painel começa conferindo o admin de novo — a tela não basta. */
export async function verificar(_anterior: EstadoAdmin, dados: FormData): Promise<EstadoAdmin> {
  const admin = await exigirAdmin();
  const lido = esquemaVerificar.safeParse({ empresa: dados.get("empresa"), metodo: dados.get("metodo") });
  if (!lido.success) return { erro: "Dados inválidos." };

  try {
    await verificarEmpresa(lido.data.empresa, { id: admin.id, email: admin.email! }, lido.data.metodo);
  } catch (erro) {
    console.error(erro);
    return { erro: "Não consegui verificar. Veja o log do servidor." };
  }
  revalidatePath("/admin", "layout");
  return { ok: "Empresa verificada." };
}

export async function desfazer(_anterior: EstadoAdmin, dados: FormData): Promise<EstadoAdmin> {
  const admin = await exigirAdmin();
  const lido = z.uuid().safeParse(dados.get("empresa"));
  if (!lido.success) return { erro: "Dados inválidos." };

  try {
    await desfazerVerificacao(lido.data, { id: admin.id, email: admin.email! });
  } catch (erro) {
    console.error(erro);
    return { erro: "Não consegui desfazer. Veja o log do servidor." };
  }
  revalidatePath("/admin", "layout");
  return { ok: "Verificação desfeita." };
}

const esquemaPlano = z.object({
  perfil: z.uuid(),
  acao: z.enum(["ativar", "desativar"]),
  dias: z.enum(["30", "365", "sempre"]).default("30"),
});

export async function mudarPlano(_anterior: EstadoAdmin, dados: FormData): Promise<EstadoAdmin> {
  const admin = await exigirAdmin();
  const lido = esquemaPlano.safeParse({
    perfil: dados.get("perfil"),
    acao: dados.get("acao"),
    dias: dados.get("dias") ?? undefined,
  });
  if (!lido.success) return { erro: "Dados inválidos." };

  const quem = { id: admin.id, email: admin.email! };
  try {
    if (lido.data.acao === "ativar") {
      await ativarPremium(lido.data.perfil, quem, lido.data.dias === "sempre" ? null : Number(lido.data.dias));
    } else {
      await desativarPremium(lido.data.perfil, quem);
    }
  } catch (erro) {
    console.error(erro);
    return { erro: "Não consegui mudar o plano. Veja o log do servidor." };
  }
  revalidatePath("/admin", "layout");
  return { ok: lido.data.acao === "ativar" ? "Premium ativado." : "Premium desativado." };
}
