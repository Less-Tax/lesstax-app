import { redirect } from "next/navigation";

/**
 * Layout de tudo que exige login.
 * É aqui — em um lugar só — que a sessão é verificada.
 * Nenhuma tela dentro de (private) precisa repetir essa checagem.
 */
export default async function LayoutPrivado({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: trocar pelo cliente do Supabase quando o login existir.
  //   const supabase = await criarClienteServidor();
  //   const { data } = await supabase.auth.getUser();
  //   if (!data.user) redirect("/entrar");
  const usuario = null;
  if (!usuario) redirect("/entrar");

  return <>{children}</>;
}
