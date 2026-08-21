import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZELO Review | Placas Inteligentes NFC + QR para Negocios",
  description: "Multiplica tus reseñas de Google y conecta con tus clientes al instante con placas inteligentes NFC y códigos QR dinámicos personalizables.",
  keywords: ["NFC", "Google Reviews", "Placas inteligentes", "QR dinámico", "Reseñas Google", "Zelo Review", "SaaS negocios"],
  authors: [{ name: "ZELO Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#090D16] text-slate-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
