import Link from "next/link";
import { redirect } from "next/navigation";
import { Abas } from "@/components/navegacao/abas";
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
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <Link href="/raio-x" className="font-display text-xl text-primary">
            less<b>tax</b>
          </Link>
          <div className="hidden md:block">
            <Abas />
          </div>
          <form action={sair}>
            <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
              Sair
            </button>
          </form>
        </div>
      </header>

      {/* espaço para a barra de abas fixa no celular */}
      <div className="flex flex-1 flex-col pb-20 md:pb-0">{children}</div>

      <div className="md:hidden">
        <Abas />
      </div>
    </>
  );
}
