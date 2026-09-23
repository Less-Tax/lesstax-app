"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Campo } from "@/components/campo";
import { CamposSenha } from "@/components/campos-senha";
import { mascaraTelefone } from "@/lib/validacao/perfil";
import { salvarDados, trocarSenha, type EstadoConta } from "./acoes";

function Retorno({ estado }: { estado: EstadoConta }) {
  if (estado.erro) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {estado.erro}
      </p>
    );
  }
  if (estado.ok) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm font-semibold text-primary">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
        {estado.ok}
      </p>
    );
  }
  return null;
}

function Botao({ enviando, texto }: { enviando: boolean; texto: string }) {
  return (
    <button
      type="submit"
      disabled={enviando}
      className="self-start rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-60"
    >
      {enviando ? "Salvando..." : texto}
    </button>
  );
}

export function FormDados({ nome, telefone, email }: { nome: string; telefone: string; email: string }) {
  const [estado, enviar, enviando] = useActionState(salvarDados, {});

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <Campo id="nome" rotulo="Seu nome" autoComplete="name" valorInicial={nome} />
      <Campo
        id="telefone"
        rotulo="Celular"
        tipo="tel"
        autoComplete="tel-national"
        valorInicial={telefone}
        obrigatorio={false}
        mascara={mascaraTelefone}
        dica="Opcional. Com DDD."
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">E-mail</span>
        <p className="rounded-lg border border-border bg-card-muted px-3.5 py-2.5 text-base text-muted-foreground">{email}</p>
        <p className="text-xs text-muted-foreground">É com ele que você entra. Para trocar, fale com a equipe.</p>
      </div>
      <Retorno estado={estado} />
      <Botao enviando={enviando} texto="Salvar dados" />
    </form>
  );
}

export function FormSenha() {
  const [estado, enviar, enviando] = useActionState(trocarSenha, {});

  return (
    <form action={enviar} className="flex flex-col gap-4">
      {/* key: depois de trocar, os campos voltam vazios */}
      <div key={estado.vez ?? 0} className="flex flex-col gap-4">
        <Campo id="atual" rotulo="Senha atual" tipo="password" autoComplete="current-password" />
        <CamposSenha rotulo="Senha nova" />
      </div>
      <Retorno estado={estado} />
      <Botao enviando={enviando} texto="Trocar senha" />
    </form>
  );
}
