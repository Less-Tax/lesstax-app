import { redirect } from "next/navigation";

/** Endereço antigo: lançar mês agora é a aba Meses. */
export default function NovoMes() {
  redirect("/meses");
}
