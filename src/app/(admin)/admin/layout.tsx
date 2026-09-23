import Link from "next/link";
import { MenuAdmin } from "@/components/admin/menu-admin";
import { exigirAdmin } from "@/lib/admin/acesso";

export const metadata = { title: "Admin — Less Tax", robots: { index: false, follow: false } };

/**
 * Painel interno. Quem não está em ADMIN_EMAILS recebe 404 aqui — e cada
 * ação confere de novo, porque uma Server Action pode ser chamada direto.
 */
export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const admin = await exigirAdmin();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/admin" className="font-display text-xl text-primary">
            less<b>tax</b> <span className="rounded-md bg-imposto-soft px-1.5 py-0.5 align-middle font-sans text-xs font-semibold text-foreground">admin</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{admin.email}</span>
            <Link href="/raio-x" className="font-semibold text-primary">
              Voltar ao app
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        <MenuAdmin />
        {children}
      </div>
    </>
  );
}
