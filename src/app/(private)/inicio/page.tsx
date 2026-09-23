import { redirect } from "next/navigation";

/**
 * Porta de entrada depois do login. O Raio-X decide o resto:
 * sem empresa → cadastro; sem mês lançado → lançar mês.
 */
export default function Inicio() {
  redirect("/raio-x");
}
