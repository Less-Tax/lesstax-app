"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/admin", rotulo: "Resumo" },
  { href: "/admin/empresas", rotulo: "Empresas" },
  { href: "/admin/usuarios", rotulo: "Usuários" },
  { href: "/admin/leads", rotulo: "Leads" },
];

export function MenuAdmin() {
  const caminho = usePathname();
  return (
    <nav aria-label="Painel" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-1">
        {ITENS.map(({ href, rotulo }) => {
          const ativo = href === "/admin" ? caminho === href : caminho.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className="block rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap text-muted-foreground aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary"
              >
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
