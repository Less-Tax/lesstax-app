import "server-only";
import { notFound } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/usuario";
import { ehAdmin } from "./regras";

export { ehAdmin } from "./regras";

/**
 * Porta de toda tela e ação do painel. Quem não é admin recebe 404,
 * como se o painel não existisse.
 */
export async function exigirAdmin() {
  const usuario = await usuarioAtual();
  if (!ehAdmin(usuario)) notFound();
  return usuario!;
}
