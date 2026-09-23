import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";

// As mesmas fontes do protótipo: Bricolage nos títulos, Figtree no texto.
const titulo = Bricolage_Grotesque({ variable: "--font-titulo", subsets: ["latin"] });
const corpo = Figtree({ variable: "--font-corpo", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Less Tax",
  description: "Descubra quanto do seu faturamento vira imposto.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${corpo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
