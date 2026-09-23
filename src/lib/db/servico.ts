import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave de serviço: IGNORA a RLS. Só para o servidor, e só
 * depois de conferir quem está pedindo (login, admin, limite...).
 */
export function clienteServico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) throw new Error("[servico] faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
}
