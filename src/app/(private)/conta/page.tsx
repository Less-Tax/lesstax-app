import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, KeyRound, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { FormEmpresa } from "@/components/empresa/form-empresa";
import { SeloVerificada } from "@/components/empresa/selo";
import { ehAdmin } from "@/lib/admin/acesso";
import { sair } from "@/lib/auth/acoes";
import { usuarioAtual } from "@/lib/auth/usuario";
import { empresasDoUsuario } from "@/lib/db/empresas";
import { perfilAtual } from "@/lib/db/perfis";
import { editarEmpresa } from "../empresa/acoes";
import { FormDados, FormSenha } from "./forms";

export const metadata = { title: "Conta — Less Tax" };

function Secao({
  id,
  titulo,
  Icone,
  children,
  extra,
}: {
  id: string;
  titulo: string;
  Icone: typeof UserRound;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="flex items-center gap-2 font-display text-lg font-bold">
          <Icone className="size-5 text-primary" aria-hidden="true" />
          {titulo}
        </h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

export default async function Conta() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");

  const [[empresa], perfil] = await Promise.all([empresasDoUsuario(), perfilAtual()]);
  if (!empresa) redirect("/empresa/nova");

  const verificada = !!empresa.verificada_em;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Conta</h1>
          <p className="text-sm text-muted-foreground">Os dados da empresa e os seus.</p>
        </div>
        {ehAdmin(usuario) ? (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-primary"
          >
            <ShieldCheck className="size-4" aria-hidden="true" />
            Painel admin
          </Link>
        ) : null}
      </div>

      <Secao
        id="titulo-empresa"
        titulo="Empresa"
        Icone={Building2}
        extra={
          verificada ? (
            <SeloVerificada />
          ) : (
            <span className="rounded-full bg-card-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              Não verificada
            </span>
          )
        }
      >
        <FormEmpresa
          acao={editarEmpresa}
          botao="Salvar empresa"
          salva={{
            cnpj: empresa.cnpj,
            nome: empresa.nome,
            atividade: empresa.atividade,
            clientes: empresa.clientes,
            funcionarios: empresa.funcionarios,
            verificada,
            cnpjRemovido: !!empresa.cnpj_removido_em,
            receita: {
              razaoSocial: empresa.razao_social,
              porte: empresa.porte,
              regime: empresa.regime,
              municipio: empresa.municipio,
              uf: empresa.uf,
              cnae: empresa.cnae_descricao,
            },
          }}
        />
      </Secao>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <Secao id="titulo-dados" titulo="Seus dados" Icone={UserRound}>
          <FormDados nome={perfil?.nome ?? ""} telefone={perfil?.telefone ?? ""} email={usuario.email ?? ""} />
        </Secao>

        <Secao id="titulo-senha" titulo="Senha" Icone={KeyRound}>
          <FormSenha />
        </Secao>
      </div>

      <form action={sair} className="md:hidden">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 font-semibold text-destructive"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sair da conta
        </button>
      </form>
    </main>
  );
}
