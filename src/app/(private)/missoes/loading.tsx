import { Bloco, Cabecalho } from "@/components/esqueleto";

/** Missões: o anel da saúde e a lista. */
export default function CarregandoMissoes() {
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <Cabecalho />
      <Bloco className="h-36" />
      <Bloco className="h-96" />
    </main>
  );
}
