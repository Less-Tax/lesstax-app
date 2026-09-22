import Link from "next/link";

export default function Inicial() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <p className="text-sm font-semibold tracking-wide text-emerald-700 dark:text-emerald-400">
          less<span className="font-bold">tax</span>
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight">
          Descubra quanto do seu faturamento vira imposto
        </h1>
        <p className="mt-2 text-black/60 dark:text-white/60">
          Menos imposto, mais impacto. Leva um minuto.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/cadastrar"
          className="rounded-xl bg-emerald-700 px-4 py-3 text-center font-semibold text-white"
        >
          Criar conta
        </Link>
        <Link
          href="/entrar"
          className="rounded-xl border border-emerald-700 px-4 py-3 text-center font-semibold text-emerald-700 dark:border-emerald-400 dark:text-emerald-400"
        >
          Já tenho conta
        </Link>
      </div>
    </main>
  );
}
