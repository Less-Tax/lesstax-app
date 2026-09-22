"use server";

import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/usuario";
import { criarEmpresa } from "@/lib/db/empresas";
import { consultarCnpj, type EmpresaReceita } from "@/lib/integracoes/brasilapi";
import { esquemaEmpresa } from "@/lib/validacao/empresa";

// ---------------------------------------------------------------- consulta

const MAX_CONSULTAS_DIA = 20;
// Contador da instância: zera a cada deploy. Suficiente para o beta;
// na fase 2 vai para o Upstash, como o Lessy.
const consultas = new Map<string, { dia: string; total: number }>();

function podeConsultar(usuarioId: string) {
  const dia = new Date().toISOString().slice(0, 10);
  const atual = consultas.get(usuarioId);
  const total = atual && atual.dia === dia ? atual.total + 1 : 1;
  consultas.set(usuarioId, { dia, total });
  return total <= MAX_CONSULTAS_DIA;
}

export type RespostaBusca = { empresa?: EmpresaReceita; erro?: string };

const MENSAGENS = {
  invalido: "CNPJ inválido. Confira os números.",
  nao_encontrado: "Não achamos esse CNPJ na Receita. Confira ou preencha à mão.",
  indisponivel: "A consulta não respondeu agora. Pode preencher os dados à mão.",
} as const;

export async function buscarCnpj(cnpj: string): Promise<RespostaBusca> {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: "Sua sessão expirou. Entre de novo." };
  if (!podeConsultar(usuario.id)) {
    return { erro: "Muitas consultas hoje. Preencha os dados à mão." };
  }

  const resultado = await consultarCnpj(cnpj);
  return resultado.ok ? { empresa: resultado.empresa } : { erro: MENSAGENS[resultado.motivo] };
}

// ---------------------------------------------------------------- cadastro

export type EstadoEmpresa = { erro?: string };

export async function salvarEmpresa(_anterior: EstadoEmpresa, dados: FormData): Promise<EstadoEmpresa> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");

  const lido = esquemaEmpresa.safeParse({
    cnpj: dados.get("cnpj") ?? "",
    nome: dados.get("nome"),
    atividade: dados.get("atividade"),
    clientes: dados.get("clientes"),
    funcionarios: dados.get("funcionarios"),
  });
  if (!lido.success) return { erro: lido.error.issues[0].message };

  // Os dados da Receita NÃO vêm do navegador — quem manda o formulário poderia
  // inventar uma razão social. O servidor consulta de novo (vem do cache).
  let receita: EmpresaReceita | null = null;
  if (lido.data.cnpj) {
    const consulta = await consultarCnpj(lido.data.cnpj);
    if (consulta.ok) receita = consulta.empresa;
  }

  const criada = await criarEmpresa(usuario.id, lido.data, receita);
  if (!criada.ok) return { erro: "Não consegui salvar agora. Tente de novo em instantes." };

  redirect("/inicio");
}
