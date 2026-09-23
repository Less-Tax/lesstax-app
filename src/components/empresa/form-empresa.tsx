"use client";

import { useActionState, useState, useTransition } from "react";
import { BadgeCheck, CheckCircle2 } from "lucide-react";
import type { EmpresaReceita } from "@/lib/integracoes/brasilapi";
import { cnpjValido, mascaraCnpj, soDigitos } from "@/lib/validacao/cnpj";
import { ATIVIDADES, CLIENTES } from "@/lib/validacao/empresa";
import { buscarCnpj, type EstadoEmpresa } from "@/app/(private)/empresa/acoes";

const caixa =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:bg-card-muted disabled:text-muted-foreground";

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
            className="rounded-lg border border-border bg-card px-2 py-2.5 text-sm aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:font-semibold aria-pressed:text-primary"
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

/** O que já está salvo, quando o formulário é de edição. */
export type EmpresaSalva = {
  cnpj: string | null;
  nome: string;
  atividade: string;
  clientes: string | null;
  funcionarios: number | null;
  verificada: boolean;
  cnpjRemovido: boolean;
  receita: {
    razaoSocial: string | null;
    porte: string | null;
    regime: string | null;
    municipio: string | null;
    uf: string | null;
    cnae: string | null;
  } | null;
};

type Acao = (anterior: EstadoEmpresa, dados: FormData) => Promise<EstadoEmpresa>;

const PORTE: Record<string, string> = { ME: "Microempresa", EPP: "Empresa de Pequeno Porte", DEMAIS: "Acima do porte EPP" };
const REGIME: Record<string, string> = {
  mei: "MEI",
  simples: "Simples Nacional",
  lucro_real: "Lucro Real",
  lucro_presumido: "Lucro Presumido",
  fora: "Fora do Simples",
};

const eAtividade = (v: string | null | undefined): v is keyof typeof ATIVIDADES => !!v && v in ATIVIDADES;
const eCliente = (v: string | null | undefined): v is keyof typeof CLIENTES => !!v && v in CLIENTES;

/**
 * Formulário da empresa. Sem `salva`, cadastra; com `salva`, edita.
 * Na edição de uma empresa verificada, o CNPJ fica travado.
 */
export function FormEmpresa({ acao, salva, botao = "Continuar" }: { acao: Acao; salva?: EmpresaSalva; botao?: string }) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  const [buscando, iniciarBusca] = useTransition();

  const cnpjSalvo = salva?.cnpj ? mascaraCnpj(salva.cnpj) : "";
  const travado = !!salva?.verificada;

  const [cnpj, setCnpj] = useState(cnpjSalvo);
  const [receita, setReceita] = useState<EmpresaReceita | null>(null);
  const [avisoBusca, setAvisoBusca] = useState("");
  const [nome, setNome] = useState(salva?.nome ?? "");
  const [nomeDigitado, setNomeDigitado] = useState(!!salva);
  const [atividade, setAtividade] = useState<keyof typeof ATIVIDADES | "">(eAtividade(salva?.atividade) ? salva.atividade : "");
  const [clientes, setClientes] = useState<keyof typeof CLIENTES | "">(eCliente(salva?.clientes) ? salva.clientes : "");
  const [funcionarios, setFuncionarios] = useState(salva?.funcionarios != null ? String(salva.funcionarios) : "");

  // Enquanto o CNPJ for o mesmo que está salvo, vale o cartão com os dados guardados.
  const mostrarSalvo = !!salva?.receita?.razaoSocial && !receita && soDigitos(cnpj) === soDigitos(cnpjSalvo) && cnpj !== "";
  const mudouAtividade = !!salva && atividade !== salva.atividade;

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
          CNPJ {travado ? null : <span className="font-normal text-muted-foreground">(opcional)</span>}
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
            readOnly={travado}
            aria-readonly={travado}
            className={`${caixa} min-w-0 flex-1 read-only:bg-card-muted read-only:text-muted-foreground`}
          />
          {travado ? null : (
          <button
            type="button"
            onClick={() => consultar(cnpj)}
            disabled={buscando}
            className="shrink-0 rounded-lg border border-primary px-4 font-semibold text-primary disabled:opacity-60"
          >
            {buscando ? "Buscando..." : "Buscar"}
          </button>
          )}
        </div>
        {travado ? (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <BadgeCheck className="size-4" aria-hidden="true" />
            Empresa verificada. Para trocar o CNPJ, fale com a equipe da Less Tax.
          </p>
        ) : salva?.cnpjRemovido && !cnpj ? (
          <p className="text-xs text-muted-foreground">
            O CNPJ desta empresa foi confirmado por outra conta e saiu daqui. Seus números continuam salvos.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {salva
              ? "Trocou de CNPJ? Digite o novo e a gente atualiza os dados da Receita."
              : "Com o CNPJ, a gente preenche o nome e o ramo sozinho. Se preferir, pule e preencha à mão."}
          </p>
        )}
        {avisoBusca ? (
          <p role="status" className="text-xs text-destructive">
            {avisoBusca}
          </p>
        ) : null}
      </div>

      {/* Cartão com o que está guardado da Receita (edição) */}
      {mostrarSalvo && salva?.receita ? (
        <div className="flex flex-col gap-1 rounded-xl border-l-4 border-primary bg-card-muted p-3.5 text-sm">
          <b>{salva.receita.razaoSocial}</b>
          <p>
            {[
              salva.receita.porte ? PORTE[salva.receita.porte] ?? salva.receita.porte : null,
              salva.receita.regime ? REGIME[salva.receita.regime] ?? null : null,
              [salva.receita.municipio, salva.receita.uf].filter(Boolean).join("/"),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {salva.receita.cnae ? <p className="text-xs text-muted-foreground">{salva.receita.cnae}</p> : null}
        </div>
      ) : null}

      {/* Cartão com o que veio da Receita */}
      {receita ? (
        <div role="status" className="flex flex-col gap-1 rounded-xl border-l-4 border-primary bg-card-muted p-3.5 text-sm">
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
            <p className="text-xs text-muted-foreground">
              CNAE {cnaeTexto(receita.cnae.codigo)} — {receita.cnae.descricao}
            </p>
          ) : null}
          {receita.atividadeSugerida ? (
            <p className="text-xs text-muted-foreground">
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
      <p className="-mt-3 text-xs text-muted-foreground">
        Serviços técnicos: tecnologia, consultoria, marketing, saúde, engenharia e parecidos.
      </p>
      {mudouAtividade ? (
        <p role="status" className="-mt-2 rounded-lg bg-imposto-soft px-3 py-2 text-xs">
          Mudar a atividade muda a conta do imposto. Ao salvar, refazemos as contas de todos os meses lançados.
        </p>
      ) : null}

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
        <p className="text-xs text-muted-foreground">Contando você e os sócios.</p>
      </div>

      {estado.erro ? (
        <p role="alert" className="text-sm text-destructive">
          {estado.erro}
        </p>
      ) : null}

      {estado.ok ? (
        <p role="status" className="flex items-center gap-2 text-sm font-semibold text-primary">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          {estado.ok}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60"
      >
        {enviando ? "Salvando..." : botao}
      </button>
    </form>
  );
}
