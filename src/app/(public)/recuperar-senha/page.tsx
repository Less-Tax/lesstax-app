import Link from "next/link";
import { recuperarSenha } from "@/lib/auth/acoes";
import { Campo } from "@/components/campo";
import { FormAuth } from "@/components/form-auth";

export const metadata = { title: "Recuperar senha — Less Tax" };

export default function RecuperarSenha() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Recuperar senha</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Enviamos um link para você criar uma senha nova.
        </p>
      </div>

      <FormAuth acao={recuperarSenha} botao="Enviar link">
        <Campo id="email" rotulo="E-mail" tipo="email" autoComplete="email" />
      </FormAuth>

      <Link href="/entrar" className="text-sm text-emerald-700 dark:text-emerald-400">
        Voltar para o login
      </Link>
    </main>
  );
}
