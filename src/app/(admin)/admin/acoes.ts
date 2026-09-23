"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin/acesso";
import { desfazerVerificacao, verificarEmpresa } from "@/lib/admin/dados";

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
