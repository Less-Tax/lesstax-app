"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/usuario";
import { empresasDoUsuario } from "@/lib/db/empresas";
import { perfilAtual } from "@/lib/db/perfis";
import { criarClienteServidor } from "@/lib/db/servidor";
import { clienteServico } from "@/lib/db/servico";
import { JANELA_REFORMA, MISSOES_MARCAVEIS, type MissaoMarcavel } from "@/lib/missoes/regras";

export type EstadoMissao = { erro?: string; ok?: boolean };

/** Referência válida de cada missão marcável. O servidor decide — não o formulário. */
const REFERENCIA: Record<MissaoMarcavel, string> = {
  fator_r: "sempre",
  monofasico: "sempre",
  anexo: "sempre",
  reforma: JANELA_REFORMA.referencia,
};

async function marcar(empresaId: string, perfilId: string, missao: string, referencia: string) {
  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("missoes_feitas")
    .upsert(
      { empresa_id: empresaId, perfil_id: perfilId, missao, referencia },
      { onConflict: "empresa_id,missao,referencia", ignoreDuplicates: true },
    );
  if (error) throw new Error(`[missoes] marcar: ${error.message}`);
}

export async function marcarMissao(_anterior: EstadoMissao, dados: FormData): Promise<EstadoMissao> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");
  const [empresa] = await empresasDoUsuario();
  if (!empresa) redirect("/empresa/nova");

  const missao = String(dados.get("missao") ?? "") as MissaoMarcavel;
  if (!MISSOES_MARCAVEIS.includes(missao)) return { erro: "Missão inválida." };

  try {
    await marcar(empresa.id, usuario.id, missao, REFERENCIA[missao]);
  } catch (erro) {
    console.error(erro);
    return { erro: "Não consegui salvar agora. Tente de novo." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Pedido de conversa com um especialista. Vai para a trilha de eventos, que
 * aparece no painel admin com nome, e-mail e celular de quem pediu.
 */
export async function pedirEspecialista(): Promise<EstadoMissao> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");
  const [empresa] = await empresasDoUsuario();
  if (!empresa) redirect("/empresa/nova");

  try {
    const perfil = await perfilAtual();
    const { error } = await clienteServico()
      .from("eventos")
      .insert({
        perfil_id: usuario.id,
        empresa_id: empresa.id,
        acao: "pedido_especialista",
        detalhe: { nome: perfil?.nome ?? null, email: usuario.email ?? null, telefone: perfil?.telefone ?? null },
      });
    if (error) throw new Error(`[missoes] evento: ${error.message}`);
    await marcar(empresa.id, usuario.id, "especialista", "sempre");
  } catch (erro) {
    console.error(erro);
    return { erro: "Não consegui registrar o pedido agora. Tente de novo." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
