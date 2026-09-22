import { usuarioAtual } from "@/lib/auth/usuario";
import { sair } from "@/lib/auth/acoes";

export const metadata = { title: "Início — Less Tax" };

/** Tela provisória: existe para provar que o login e o bloqueio funcionam. */
export default async function Inicio() {
  const usuario = await usuarioAtual();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Você está dentro</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Logado como {usuario?.email}.
        </p>
      </div>

      <p className="text-sm text-black/60 dark:text-white/60">
        Esta tela é provisória. O Raio-X entra aqui na próxima etapa.
      </p>

      <form action={sair}>
        <button
          type="submit"
          className="rounded-xl border border-emerald-700 px-4 py-3 font-semibold text-emerald-700 dark:border-emerald-400 dark:text-emerald-400"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
