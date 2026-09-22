import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente do Supabase para Server Components, Server Actions e rotas.
 * Usa a chave pública: quem decide o que este usuário enxerga é a RLS.
 */
export async function criarClienteServidor() {
  const bolachas = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return bolachas.getAll();
        },
        setAll(lista) {
          try {
            for (const { name, value, options } of lista) {
              bolachas.set(name, value, options);
            }
          } catch {
            // Server Component não pode gravar cookie.
            // Tudo bem: quem renova a sessão é o proxy.
          }
        },
      },
    },
  );
}
