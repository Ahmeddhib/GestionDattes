import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { getServerLocale } from "@/i18n/server";
import { localeDirections } from "@/i18n/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestion Dattes - Système ERP",
  description: "Système de gestion des dattes multi-tenant",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    // `data-scroll-behavior="smooth"` acquitte le `scroll-behavior: smooth`
    // déclaré sur `html` dans globals.css. Sans cet attribut, Next avertit et
    // laisse le défilement animé s'appliquer aux changements de route : la
    // restauration de position au retour arrière devient une animation, et
    // atterrit à côté. Voir MainScrollRestoration.
    <html
      lang={locale}
      dir={localeDirections[locale]}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <LocaleProvider initialLocale={locale}>
            {children}
            <Toaster position="top-right" richColors />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
