import { definirSenha } from "@/lib/auth/acoes";
import { Campo } from "@/components/campo";
import { FormAuth } from "@/components/form-auth";

export const metadata = { title: "Nova senha — Less Tax" };

/**
 * Fica em (private) de propósito: quem clicou no link de recuperação já está
 * autenticado quando chega aqui. Quem entrar direto pela URL cai no login.
 */
export default function NovaSenha() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Criar senha nova</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Escolha uma senha e você já entra direto.
        </p>
      </div>

      <FormAuth acao={definirSenha} botao="Salvar senha">
        <Campo
          id="senha"
          rotulo="Nova senha"
          tipo="password"
          autoComplete="new-password"
          dica="Pelo menos 8 caracteres."
        />
        <Campo
          id="confirmacao"
          rotulo="Repita a senha"
          tipo="password"
          autoComplete="new-password"
        />
      </FormAuth>
    </main>
  );
}
