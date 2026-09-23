import { redirect } from "next/navigation";
import { empresasDoUsuario } from "@/lib/db/empresas";
import { FormMes } from "./form-mes";

export const metadata = { title: "Lançar mês — Less Tax" };

export default async function NovoMes() {
  const [empresa] = await empresasDoUsuario();
  if (!empresa) redirect("/empresa/nova");

  // Por padrão, o mês que acabou de fechar.
  const hoje = new Date();
  const anterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Os números de um mês</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use valores aproximados de um mês comum de {empresa.nome}. Leva um minuto.
        </p>
      </div>
      <FormMes
        comercio={empresa.atividade === "comercio"}
        anoPadrao={anterior.getFullYear()}
        mesPadrao={anterior.getMonth() + 1}
      />
    </main>
  );
}
