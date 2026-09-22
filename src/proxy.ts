import type { NextRequest } from "next/server";
import { renovarSessao } from "@/lib/db/sessao";

// No Next.js 16 este arquivo se chama proxy.ts (antes era middleware.ts).
export async function proxy(request: NextRequest) {
  return await renovarSessao(request);
}

export const config = {
  matcher: [
    // tudo, menos arquivos estáticos e imagens
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
