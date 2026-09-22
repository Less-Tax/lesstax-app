import Link from "next/link";
import { entrar } from "@/lib/auth/acoes";
import { Caixa } from "@/components/caixa";
import { Campo } from "@/components/campo";
import { FormAuth } from "@/components/form-auth";
import { mandarParaInicioSeLogado } from "@/lib/auth/usuario";

export const metadata = { title: "Entrar — Less Tax" };

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  await mandarParaInicioSeLogado();
  const { erro } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Entrar</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Acesse o Raio-X da sua empresa.
        </p>
      </div>

      {erro === "link_invalido" ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          Esse link expirou ou já foi usado. Peça um novo em &quot;Esqueci minha senha&quot;.
        </p>
      ) : null}

      <FormAuth acao={entrar} botao="Entrar">
        <Campo id="email" rotulo="E-mail" tipo="email" autoComplete="email" />
        <Campo id="senha" rotulo="Senha" tipo="password" autoComplete="current-password" />
        <Caixa id="lembrar" rotulo="Manter conectado" marcadoPorPadrao />
      </FormAuth>

      <div className="flex flex-col gap-2 text-sm">
        <Link href="/recuperar-senha" className="text-emerald-700 dark:text-emerald-400">
          Esqueci minha senha
        </Link>
        <p className="text-black/60 dark:text-white/60">
          Ainda não tem conta?{" "}
          <Link href="/cadastrar" className="text-emerald-700 dark:text-emerald-400">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}
