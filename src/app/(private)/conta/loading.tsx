import { Bloco, Cabecalho } from "@/components/esqueleto";

/** Conta: o cartão da empresa e, embaixo, dados e senha lado a lado. */
export default function CarregandoConta() {
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <Cabecalho />
      <Bloco className="h-[28rem]" />
      <div className="grid gap-6 md:grid-cols-2">
        <Bloco className="h-80" />
        <Bloco className="h-80" />
      </div>
    </main>
  );
}
