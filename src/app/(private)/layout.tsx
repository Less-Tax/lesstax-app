import Link from "next/link";
import { redirect } from "next/navigation";
import { sair } from "@/lib/auth/acoes";
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

  return (
    <>
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 pt-5">
        <Link href="/raio-x" className="text-lg text-primary">
          less<b>tax</b>
        </Link>
        <form action={sair}>
          <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
            Sair
          </button>
        </form>
      </header>
      {children}
    </>
  );
}
