"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Gauge, MessageCircle, UserRound } from "lucide-react";

const ABAS = [
  { href: "/raio-x", rotulo: "Raio-X", Icone: Gauge },
  { href: "/meses", rotulo: "Meses", Icone: CalendarDays },
  { href: "/lessy", rotulo: "Lessy", Icone: MessageCircle },
  { href: "/conta", rotulo: "Conta", Icone: UserRound },
];

/**
 * Abas do app. No celular ficam presas embaixo, como em app de banco;
 * no computador sobem para o cabeçalho.
 */
export function Abas() {
  const caminho = usePathname();

  return (
    <nav
      aria-label="Seções"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:static md:border-0 md:bg-transparent md:pb-0 md:backdrop-blur-none"
    >
      <ul className="mx-auto flex max-w-md md:max-w-none md:gap-1">
        {ABAS.map(({ href, rotulo, Icone }) => {
          const ativa = caminho === href || caminho.startsWith(href + "/");
          return (
            <li key={href} className="flex-1 md:flex-none">
              <Link
                href={href}
                aria-current={ativa ? "page" : undefined}
                className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold text-muted-foreground aria-[current=page]:text-primary md:flex-row md:gap-2 md:rounded-full md:px-4 md:py-2 md:text-sm md:aria-[current=page]:bg-primary-soft"
              >
                <Icone aria-hidden="true" className="size-5 md:size-4" />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
