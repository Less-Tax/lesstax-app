import Link from "next/link";
import { cadastrar } from "@/lib/auth/acoes";
import { Campo } from "@/components/campo";
import { FormAuth } from "@/components/form-auth";

export const metadata = { title: "Criar conta — Less Tax" };

export default function Cadastrar() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Leva um minuto. Depois é só informar o CNPJ.
        </p>
      </div>

      <FormAuth acao={cadastrar} botao="Criar conta">
        <Campo id="nome" rotulo="Seu nome" autoComplete="name" />
        <Campo id="email" rotulo="E-mail" tipo="email" autoComplete="email" />
        <Campo
          id="senha"
          rotulo="Senha"
          tipo="password"
          autoComplete="new-password"
          dica="Pelo menos 8 caracteres."
        />
      </FormAuth>

      <p className="text-sm text-black/60 dark:text-white/60">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-emerald-700 dark:text-emerald-400">
          Entrar
        </Link>
      </p>
    </main>
  );
}
