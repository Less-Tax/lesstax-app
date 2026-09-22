/** Utilidades de CNPJ. Puras: servem para a tela e para o servidor. */

export const soDigitos = (valor: string) => valor.replace(/\D/g, "");

/** 00.000.000/0000-00, aplicada enquanto a pessoa digita. */
export function mascaraCnpj(valor: string) {
  const d = soDigitos(valor).slice(0, 14);
  let s = d.slice(0, 2);
  if (d.length > 2) s += "." + d.slice(2, 5);
  if (d.length > 5) s += "." + d.slice(5, 8);
  if (d.length > 8) s += "/" + d.slice(8, 12);
  if (d.length > 12) s += "-" + d.slice(12, 14);
  return s;
}

/** Confere os dois dígitos verificadores. Evita consultar número digitado errado. */
export function cnpjValido(valor: string) {
  const c = soDigitos(valor);
  if (!/^\d{14}$/.test(c) || /^(\d)\1{13}$/.test(c)) return false;
  const dv = (base: string) => {
    let peso = base.length - 7;
    let soma = 0;
    for (const digito of base) {
      soma += Number(digito) * peso--;
      if (peso < 2) peso = 9;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return dv(c.slice(0, 12)) === Number(c[12]) && dv(c.slice(0, 13)) === Number(c[13]);
}
