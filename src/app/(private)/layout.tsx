import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/usuario";

/**
 * Layout de tudo que exige login.
 * A sessão é verificada aqui — em um lugar só. Nenhuma tela dentro de
 * (private) precisa repetir essa checagem.
 */
export default async function LayoutPrivado({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");

  return <>{children}</>;
}
