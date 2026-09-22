"use client";

import { useActionState, useState, useTransition } from "react";
import type { EmpresaReceita } from "@/lib/integracoes/brasilapi";
import { cnpjValido, mascaraCnpj, soDigitos } from "@/lib/validacao/cnpj";
import { ATIVIDADES, CLIENTES } from "@/lib/validacao/empresa";
import { buscarCnpj, salvarEmpresa } from "./acoes";

const caixa =
  "w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-base outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/40 dark:border-white/20 dark:bg-white/5";

function Opcoes<T extends string>({
  nome,
  rotulo,
  opcoes,
  valor,
  aoEscolher,
  colunas = 2,
}: {
  nome: string;
  rotulo: string;
  opcoes: Record<T, string>;
  valor: T | "";
  aoEscolher: (v: T) => void;
  colunas?: 2 | 3;
}) {
  const idRotulo = `rotulo-${nome}`;
  return (
    <div className="flex flex-col gap-1.5">
      <span id={idRotulo} className="text-sm font-semibold">
        {rotulo}
      </span>
      <div role="group" aria-labelledby={idRotulo} className={`grid gap-1.5 ${colunas === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {(Object.entries(opcoes) as [T, string][]).map(([chave, texto]) => (
          <button
            key={chave}
            type="button"
            aria-pressed={valor === chave}
            onClick={() => aoEscolher(chave)}
            className="rounded-lg border border-black/15 px-2 py-2.5 text-sm aria-pressed:border-emerald-600 aria-pressed:bg-emerald-600/10 aria-pressed:font-semibold aria-pressed:text-emerald-700 dark:border-white/20 dark:aria-pressed:text-emerald-400"
          >
            {texto}
          </button>
        ))}
      </div>
      <input type="hidden" name={nome} value={valor} />
    </div>
  );
}

const dataBr = (iso: string | null) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};

const cnaeTexto = (codigo: number) => {
  const d = String(codigo).padStart(7, "0");
  return `${d.slice(0, 4)}-${d[4]}/${d.slice(5)}`;
};

export function FormEmpresa() {
  const [estado, enviar, enviando] = useActionState(salvarEmpresa, {});
  const [buscando, iniciarBusca] = useTransition();

  const [cnpj, setCnpj] = useState("");
  const [receita, setReceita] = useState<EmpresaReceita | null>(null);
  const [avisoBusca, setAvisoBusca] = useState("");
  const [nome, setNome] = useState("");
  const [nomeDigitado, setNomeDigitado] = useState(false);
  const [atividade, setAtividade] = useState<keyof typeof ATIVIDADES | "">("");
  const [clientes, setClientes] = useState<keyof typeof CLIENTES | "">("");
  const [funcionarios, setFuncionarios] = useState("");

  function consultar(valor: string) {
    if (!cnpjValido(valor)) {
      setAvisoBusca("CNPJ inválido. Confira os números.");
      return;
    }
    setAvisoBusca("");
    iniciarBusca(async () => {
      const resposta = await buscarCnpj(valor);
      if (!resposta.empresa) {
        setReceita(null);
        setAvisoBusca(resposta.erro ?? "");
        return;
      }
      setReceita(resposta.empresa);
      if (!nomeDigitado) setNome(resposta.empresa.nome);
      if (resposta.empresa.atividadeSugerida) setAtividade(resposta.empresa.atividadeSugerida);
    });
  }

  function mudarCnpj(valor: string) {
    const mascarado = mascaraCnpj(valor);
    setCnpj(mascarado);
    if (receita && receita.cnpj !== soDigitos(mascarado)) setReceita(null);
    if (soDigitos(mascarado).length === 14) consultar(mascarado);
    else setAvisoBusca("");
  }

  const regimeForaDoSimples =
    receita && ["lucro_real", "lucro_presumido", "fora"].includes(receita.regime.tipo);

  return (
    <form action={enviar} className="flex flex-col gap-5">
      {/* CNPJ */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cnpj" className="text-sm font-semibold">
          CNPJ <span className="font-normal text-black/50 dark:text-white/50">(opcional)</span>
        </label>
        <div className="flex gap-2">
          <input
            id="cnpj"
            name="cnpj"
            inputMode="numeric"
            autoComplete="off"
            placeholder="00.000.000/0000-00"
            value={cnpj}
            onChange={(e) => mudarCnpj(e.target.value)}
            className={`${caixa} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={() => consultar(cnpj)}
            disabled={buscando}
            className="shrink-0 rounded-lg border border-emerald-700 px-4 font-semibold text-emerald-700 disabled:opacity-60 dark:border-emerald-400 dark:text-emerald-400"
          >
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </div>
        <p className="text-xs text-black/55 dark:text-white/55">
          Com o CNPJ, a gente preenche o nome e o ramo sozinho. Se preferir, pule e preencha à mão.
        </p>
        {avisoBusca ? (
          <p role="status" className="text-xs text-red-600 dark:text-red-400">
            {avisoBusca}
          </p>
        ) : null}
      </div>

      {/* Cartão com o que veio da Receita */}
      {receita ? (
        <div role="status" className="flex flex-col gap-1 rounded-xl border-l-4 border-emerald-600 bg-black/[0.03] p-3.5 text-sm dark:bg-white/5">
          <b>{receita.razaoSocial}</b>
          <p>
            {[
              receita.porteTexto,
              receita.regime.texto + (receita.regime.desde ? ` desde ${dataBr(receita.regime.desde)}` : ""),
              [receita.municipio, receita.uf].filter(Boolean).join("/"),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {receita.cnae ? (
            <p className="text-xs text-black/55 dark:text-white/55">
              CNAE {cnaeTexto(receita.cnae.codigo)} — {receita.cnae.descricao}
            </p>
          ) : null}
          {receita.atividadeSugerida ? (
            <p className="text-xs text-black/55 dark:text-white/55">
              Marcamos &quot;{ATIVIDADES[receita.atividadeSugerida]}&quot; pelo CNAE. Se não for isso, troque abaixo.
            </p>
          ) : null}
          {regimeForaDoSimples ? (
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Pela Receita, a empresa não está no Simples Nacional. O Raio-X calcula o Simples, então os
              números serão só uma referência.
            </p>
          ) : null}
          {receita.situacao && receita.situacao !== "ATIVA" ? (
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Atenção: na Receita esta empresa está {receita.situacao.toLowerCase()}.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Nome */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nome" className="text-sm font-semibold">
          Nome da empresa
        </label>
        <input
          id="nome"
          name="nome"
          autoComplete="organization"
          placeholder="Ex.: Mercado da Praça"
          required
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setNomeDigitado(true);
          }}
          className={caixa}
        />
      </div>

      <Opcoes nome="atividade" rotulo="O que a empresa faz?" opcoes={ATIVIDADES} valor={atividade} aoEscolher={setAtividade} />
      <p className="-mt-3 text-xs text-black/55 dark:text-white/55">
        Serviços técnicos: tecnologia, consultoria, marketing, saúde, engenharia e parecidos.
      </p>

      <Opcoes nome="clientes" rotulo="Para quem mais vende?" opcoes={CLIENTES} valor={clientes} aoEscolher={setClientes} colunas={3} />

      {/* Funcionários: a Receita não informa, então perguntamos */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="funcionarios" className="text-sm font-semibold">
          Quantas pessoas trabalham na empresa?
        </label>
        <input
          id="funcionarios"
          name="funcionarios"
          type="number"
          inputMode="numeric"
          min={0}
          required
          value={funcionarios}
          onChange={(e) => setFuncionarios(e.target.value)}
          className={caixa}
        />
        <p className="text-xs text-black/55 dark:text-white/55">Contando você e os sócios.</p>
      </div>

      {estado.erro ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {estado.erro}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {enviando ? "Salvando..." : "Continuar"}
      </button>
    </form>
  );
}
