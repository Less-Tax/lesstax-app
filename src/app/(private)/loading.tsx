import { Bloco, Cabecalho } from "@/components/esqueleto";

/** Formato genérico, para telas que não têm o seu (ex.: cadastro da empresa). */
export default function Carregando() {
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <Cabecalho />
      <Bloco className="h-80" />
    </main>
  );
}
