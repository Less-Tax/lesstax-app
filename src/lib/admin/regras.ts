/** E-mails de admin, da variável ADMIN_EMAILS (separados por vírgula). */
export function emailsAdmin(valor = process.env.ADMIN_EMAILS ?? "") {
  return new Set(
    valor
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Admin é quem tem e-mail confirmado E listado em ADMIN_EMAILS. */
export function ehAdmin(
  usuario: { email?: string | null; email_confirmed_at?: string | null } | null,
  lista = emailsAdmin(),
) {
  if (!usuario?.email || !usuario.email_confirmed_at) return false;
  return lista.has(usuario.email.toLowerCase());
}
