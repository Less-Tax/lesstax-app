/**
 * "Manter conectado": decide o prazo dos cookies de sessão.
 *
 * Padrão é lembrar por 30 dias. Quem desmarcar a opção no login recebe
 * cookie de sessão — some quando o navegador fecha.
 */
export const COOKIE_LEMBRAR = "lt_lembrar";
export const DIAS_LEMBRAR = 30;
export const SEGUNDOS_LEMBRAR = DIAS_LEMBRAR * 24 * 60 * 60;

/** Só o valor "0" desliga; ausente ou qualquer outra coisa mantém conectado. */
export function querLembrar(valor: string | undefined) {
  return valor !== "0";
}

/** Aplica (ou remove) o prazo nos cookies que o Supabase manda gravar. */
export function comPrazo<T extends { maxAge?: number; expires?: Date }>(
  opcoes: T,
  lembrar: boolean,
): T {
  if (lembrar) return { ...opcoes, maxAge: SEGUNDOS_LEMBRAR };

  // Sem prazo: o cookie vira de sessão e some quando o navegador fecha.
  const resto = { ...opcoes };
  delete resto.maxAge;
  delete resto.expires;
  return resto;
}
