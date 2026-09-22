"use client";

import { useState } from "react";
import { REGRAS_SENHA, forcaDaSenha } from "@/lib/validacao/auth";

const NIVEIS = [
  { rotulo: "muito fraca", cor: "bg-red-500", texto: "text-red-600 dark:text-red-400" },
  { rotulo: "fraca", cor: "bg-red-500", texto: "text-red-600 dark:text-red-400" },
  { rotulo: "razoável", cor: "bg-amber-500", texto: "text-amber-600 dark:text-amber-400" },
  { rotulo: "boa", cor: "bg-amber-500", texto: "text-amber-600 dark:text-amber-400" },
  { rotulo: "forte", cor: "bg-emerald-600", texto: "text-emerald-700 dark:text-emerald-400" },
];

const caixa =
  "w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-base outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/40 dark:border-white/20 dark:bg-white/5";

export function CamposSenha({ rotulo = "Senha" }: { rotulo?: string }) {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");

  const forca = forcaDaSenha(senha);
  const nivel = NIVEIS[forca];
  const diferentes = confirmacao.length > 0 && confirmacao !== senha;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="senha" className="text-sm font-semibold">
          {rotulo}
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className={caixa}
          aria-describedby="regras-senha"
        />

        {senha.length > 0 ? (
          <div className="mt-1 flex items-center gap-2">
            <div className="flex h-1.5 flex-1 gap-1" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-full flex-1 rounded-full ${i < forca ? nivel.cor : "bg-black/10 dark:bg-white/15"}`}
                />
              ))}
            </div>
            <span className={`text-xs font-semibold ${nivel.texto}`}>{nivel.rotulo}</span>
          </div>
        ) : null}

        <ul id="regras-senha" className="mt-1 flex flex-col gap-0.5">
          {REGRAS_SENHA.map((regra) => {
            const ok = regra.vale(senha);
            return (
              <li
                key={regra.id}
                className={`flex items-center gap-1.5 text-xs ${
                  ok ? "text-emerald-700 dark:text-emerald-400" : "text-black/50 dark:text-white/50"
                }`}
              >
                <span aria-hidden="true">{ok ? "✓" : "○"}</span>
                {regra.texto}
                <span className="sr-only">{ok ? " (cumprido)" : " (falta)"}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmacao" className="text-sm font-semibold">
          Repita a senha
        </label>
        <input
          id="confirmacao"
          name="confirmacao"
          type="password"
          autoComplete="new-password"
          required
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          className={caixa}
          aria-invalid={diferentes}
        />
        {diferentes ? (
          <p className="text-xs text-red-600 dark:text-red-400">As duas senhas não são iguais.</p>
        ) : null}
      </div>
    </>
  );
}
