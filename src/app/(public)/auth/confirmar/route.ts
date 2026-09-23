import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { criarClienteServidor } from "@/lib/db/servidor";
import { destinoSeguro } from "@/lib/seguranca/destino";

/**
 * Destino dos links de e-mail (confirmação de conta e recuperação de senha).
 * Aceita os dois formatos que o Supabase pode enviar: ?code= e ?token_hash=.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const destino = destinoSeguro(searchParams.get("next"));
  const supabase = await criarClienteServidor();

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${destino}`);
  }

  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${destino}`);
  }

  return NextResponse.redirect(`${origin}/entrar?erro=link_invalido`);
}
