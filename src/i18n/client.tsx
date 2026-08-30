"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { formatMoney, formatNumber, makeTranslator, type Dict, type Translate } from ".";

type Ctx = { locale: Locale; t: Translate; money: (n: number) => string; num: (n: number) => string };

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: React.ReactNode }) {
  const value = useMemo<Ctx>(() => {
    const t = makeTranslator(dict);
    return { locale, t, money: (n) => formatMoney(n, locale), num: (n) => formatNumber(n, locale) };
  }, [locale, dict]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  // Fallback keeps client components renderable outside a provider (e.g. tests).
  const t = makeTranslator({});
  return {
    locale: DEFAULT_LOCALE,
    t,
    money: (n) => formatMoney(n, DEFAULT_LOCALE),
    num: (n) => formatNumber(n, DEFAULT_LOCALE),
  };
}
