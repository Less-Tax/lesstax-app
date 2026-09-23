import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/usuario";
import { empresasDoUsuario } from "@/lib/db/empresas";
import { simulacoesPorMes } from "@/lib/db/simulacoes";
import { limiteMensal } from "@/lib/lessy/limites";
import { conversaParaAbrir, conversasDe, planoDe, usoDoMes } from "@/lib/lessy/servidor";
import { sugestoes } from "@/lib/lessy/sugestoes";
import { nomeDoMes } from "@/lib/formato";
import { Chat } from "./chat";

export const metadata = { title: "Lessy — Less Tax" };

export default async function Lessy({ searchParams }: { searchParams: Promise<{ conversa?: string; nova?: string; pergunta?: string }> }) {
  const parametros = await searchParams;
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");
  const [empresa] = await empresasDoUsuario();
  if (!empresa) redirect("/empresa/nova");

  const agora = new Date();
  const [plano, usadas, conversa, historico, simulacoes] = await Promise.all([
    planoDe(usuario.id, agora),
    usoDoMes(usuario.id, agora),
    parametros.nova ? null : conversaParaAbrir(empresa.id, usuario.id, parametros.conversa),
    conversasDe(empresa.id, usuario.id),
    simulacoesPorMes(empresa.id),
  ]);
  const limite = limiteMensal(plano);
  const ultima = simulacoes.at(-1);
  const mesAtual = nomeDoMes(Number(agora.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(5, 7)));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 px-4">
      <Chat
        key={conversa?.id ?? "nova"}
        conversaInicial={conversa}
        historico={historico}
        perguntaInicial={(parametros.pergunta ?? "").slice(0, 500)}
        restantesInicial={Math.max(0, limite - usadas)}
        limite={limite}
        gratuito={plano === "gratuito"}
        mes={mesAtual}
        sugestoes={sugestoes(empresa.atividade, ultima ? { mes: ultima.entrada.mes, resultado: ultima.resultado } : null, agora)}
      />
    </main>
  );
}
