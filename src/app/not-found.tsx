import Link from "next/link";

export const metadata = { title: "Página não encontrada — Less Tax" };

export default function NaoEncontrada() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="font-display text-xl text-primary">
        less<b>tax</b>
      </p>
      <h1 className="font-display text-2xl font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço pode ter mudado ou não existe mais.</p>
      <Link href="/" className="rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground">
        Voltar ao início
      </Link>
    </main>
  );
}
