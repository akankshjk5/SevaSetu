import type { Metadata, Viewport } from "next";
import { Geist, Noto_Sans_Devanagari, Noto_Sans_Kannada } from "next/font/google";
import "./globals.css";
import { getLocale, getSimpleMode } from "@/i18n/server";
import { dictionaryFor } from "@/i18n";
import { I18nProvider } from "@/i18n/client";

/**
 * Geist covers Latin only. Without an Indic face the browser falls back to
 * whatever the device happens to have — which renders Hindi and Kannada in a
 * mismatched serif on many machines. Loading Noto for both scripts keeps all
 * three languages looking like one product; the browser picks the right face
 * per glyph, so no locale switching is needed in CSS.
 */
const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const devanagari = Noto_Sans_Devanagari({
  variable: "--font-deva",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const kannada = Noto_Sans_Kannada({
  variable: "--font-knda",
  subsets: ["kannada"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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
  const simple = await getSimpleMode();

  return (
    <html lang={locale} data-simple={simple ? "1" : "0"}>
      <body className={`${geist.variable} ${devanagari.variable} ${kannada.variable} antialiased`}>
        <I18nProvider locale={locale} dict={dictionaryFor(locale)}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
