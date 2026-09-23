import { Bloco, Cabecalho, Linha } from "@/components/esqueleto";

/** Raio-X: seletor de mês, o número principal, dois números, a rosca e a evolução. */
export default function CarregandoRaioX() {
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <Cabecalho />
      <div className="flex items-center justify-between">
        <Linha className="size-11 rounded-full" />
        <Linha className="h-7 w-44" />
        <Linha className="size-11 rounded-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-4">
          <Bloco className="h-40" />
          <div className="grid grid-cols-2 gap-3">
            <Bloco className="h-24" />
            <Bloco className="h-24" />
          </div>
          <Bloco className="h-64" />
        </div>
        <Bloco className="h-96" />
      </div>
    </main>
  );
}
