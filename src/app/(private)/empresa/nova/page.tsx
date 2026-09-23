import { redirect } from "next/navigation";
import { empresasDoUsuario } from "@/lib/db/empresas";
import { FormEmpresa } from "@/components/empresa/form-empresa";
import { salvarEmpresa } from "../acoes";

export const metadata = { title: "Sua empresa — Less Tax" };

export default async function NovaEmpresa() {
  // No plano gratuito é uma empresa por conta. Quem já tem vai direto ao início.
  // Quando o plano pago existir, esta checagem passa a olhar o plano.
  const empresas = await empresasDoUsuario();
  if (empresas.length > 0) redirect("/inicio");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Conte sobre a sua empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Só o básico. Os números do mês vêm no próximo passo.
        </p>
      </div>
      <FormEmpresa acao={salvarEmpresa} />
    </main>
  );
}
