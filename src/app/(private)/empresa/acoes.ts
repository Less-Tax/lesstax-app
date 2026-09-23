"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/usuario";
import { atualizarEmpresa, criarEmpresa, empresasDoUsuario } from "@/lib/db/empresas";
import { recalcularMeses } from "@/lib/db/recalcular";
import { consultarCnpj, type EmpresaReceita } from "@/lib/integracoes/brasilapi";
import type { Atividade } from "@/lib/tributario";
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

// ---------------------------------------------------------------- comum

export type EstadoEmpresa = { erro?: string; ok?: string };

const ERRO_CNPJ_VERIFICADO =
  "Este CNPJ já foi confirmado por outra conta. Se você faz parte da empresa, peça um convite ao responsável — ou apague o CNPJ e continue sem ele.";
const ERRO_FALHA = "Não consegui salvar agora. Tente de novo em instantes.";

function lerFormulario(dados: FormData) {
  return esquemaEmpresa.safeParse({
    cnpj: dados.get("cnpj") ?? "",
    nome: dados.get("nome"),
    atividade: dados.get("atividade"),
    clientes: dados.get("clientes"),
    funcionarios: dados.get("funcionarios"),
  });
}

/**
 * Os dados da Receita NÃO vêm do navegador — quem manda o formulário poderia
 * inventar uma razão social. O servidor consulta de novo (vem do cache).
 */
async function receitaDo(cnpj: string): Promise<EmpresaReceita | null> {
  if (!cnpj) return null;
  const consulta = await consultarCnpj(cnpj);
  return consulta.ok ? consulta.empresa : null;
}

// ---------------------------------------------------------------- cadastro

export async function salvarEmpresa(_anterior: EstadoEmpresa, dados: FormData): Promise<EstadoEmpresa> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");

  const lido = lerFormulario(dados);
  if (!lido.success) return { erro: lido.error.issues[0].message };

  const criada = await criarEmpresa(usuario.id, lido.data, await receitaDo(lido.data.cnpj));
  if (!criada.ok) return { erro: criada.motivo === "cnpj_verificado" ? ERRO_CNPJ_VERIFICADO : ERRO_FALHA };

  redirect("/inicio");
}

// ---------------------------------------------------------------- edição

export async function editarEmpresa(_anterior: EstadoEmpresa, dados: FormData): Promise<EstadoEmpresa> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");

  // A empresa editada é a do usuário, lida no servidor — nunca um id do formulário.
  const [empresa] = await empresasDoUsuario();
  if (!empresa) redirect("/empresa/nova");

  const lido = lerFormulario(dados);
  if (!lido.success) return { erro: lido.error.issues[0].message };
  const novo = lido.data;

  // Empresa verificada fica com o CNPJ confirmado. O banco também barra.
  const cnpjAnterior = empresa.cnpj ?? "";
  if (empresa.verificada_em) novo.cnpj = cnpjAnterior;

  const receita = novo.cnpj === cnpjAnterior ? "manter" : await receitaDo(novo.cnpj);
  const salva = await atualizarEmpresa(empresa.id, novo, receita);
  if (!salva.ok) return { erro: salva.motivo === "cnpj_verificado" ? ERRO_CNPJ_VERIFICADO : ERRO_FALHA };

  // A atividade decide o anexo do Simples: muda a conta de todos os meses.
  let recalculados = 0;
  if (novo.atividade !== empresa.atividade) {
    try {
      recalculados = await recalcularMeses(empresa.id, novo.atividade as Atividade);
    } catch (erro) {
      console.error(erro);
      return { erro: "A empresa foi salva, mas as contas dos meses não foram refeitas. Avise a equipe da Less Tax." };
    }
  }

  revalidatePath("/", "layout");
  return {
    ok:
      recalculados > 0
        ? `Empresa atualizada. Refizemos as contas de ${recalculados} ${recalculados === 1 ? "mês" : "meses"} com a nova atividade.`
        : "Empresa atualizada.",
  };
}
