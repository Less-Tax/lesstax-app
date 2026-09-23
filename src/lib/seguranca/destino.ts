/**
 * Para onde mandar depois do login/link de e-mail. Só aceita caminho interno
 * ("/raio-x"). Qualquer outra coisa ("@site.com", "//site.com", "https://...")
 * vira o padrão — sem isso, um link com ?next= malicioso levaria para fora.
 */
export function destinoSeguro(valor: string | null | undefined, padrao = "/inicio") {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) return padrao;
  if (/[\u0000-\u001f\\]/.test(valor)) return padrao;
  return valor;
}
