import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_LEMBRAR, comPrazo, querLembrar } from "@/lib/auth/lembrar";

/**
 * Renova o token a cada requisição e devolve os cookies atualizados.
 * Chamado pelo proxy.ts. Sem isso, a sessão morre em cerca de uma hora.
 */
export async function renovarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(lista) {
          const lembrar = querLembrar(request.cookies.get(COOKIE_LEMBRAR)?.value);
          for (const { name, value } of lista) {
            request.cookies.set(name, value);
          }
          resposta = NextResponse.next({ request });
          for (const { name, value, options } of lista) {
            resposta.cookies.set(name, value, comPrazo(options, lembrar));
          }
        },
      },
    },
  );

  // Não remova: é esta chamada que renova o token.
  await supabase.auth.getUser();

  return resposta;
}
