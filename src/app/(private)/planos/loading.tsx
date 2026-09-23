import { Bloco, Cabecalho } from "@/components/esqueleto";

export default function CarregandoPlanos() {
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
      <Cabecalho />
      <div className="grid gap-4 md:grid-cols-2">
        <Bloco className="h-52" />
        <Bloco className="h-52" />
      </div>
      <Bloco className="h-96" />
    </main>
  );
}
