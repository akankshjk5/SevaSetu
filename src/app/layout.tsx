import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/i18n/server";
import { dictionaryFor } from "@/i18n";
import { I18nProvider } from "@/i18n/client";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SevaSetu — verified household and site workforce",
  description:
    "Book verified cleaners, cooks, house helpers, gardeners, plumbers and electricians, hire site teams, and see district skill demand. Police-verified, skill-checked and insured workers.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className={`${geist.variable} antialiased`}>
        <I18nProvider locale={locale} dict={dictionaryFor(locale)}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
