import { cookies } from "next/headers";
import { db } from "@/lib/store";
import { getSession } from "@/lib/session";
import { DEFAULT_LOCALE, LANG_COOKIE, SIMPLE_COOKIE, isLocale, type Locale } from "./config";
import { dictionaryFor, formatDate, formatMoney, formatNumber, formatShortDate, makeTranslator, type Translate } from ".";

/**
 * Resolution order: cookie (this device) → the language saved on the user's
 * profile (follows them across devices) → English.
 */
export async function getLocale(): Promise<Locale> {
  const cookie = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  const session = await getSession();
  if (session) {
    const user = db().users.find((u) => u.id === session.userId);
    if (isLocale(user?.language)) return user.language;
  }
  return DEFAULT_LOCALE;
}

/**
 * Easy mode resolves like the locale: cookie for this device, else the flag
 * saved on the profile so it follows the worker to another phone.
 */
export async function getSimpleMode(): Promise<boolean> {
  const cookie = (await cookies()).get(SIMPLE_COOKIE)?.value;
  if (cookie === "1") return true;
  if (cookie === "0") return false;

  const session = await getSession();
  if (session) {
    const user = db().users.find((u) => u.id === session.userId);
    if (user?.simpleMode !== undefined) return user.simpleMode;
  }
  return false;
}

export type I18n = {
  locale: Locale;
  simple: boolean;
  t: Translate;
  money: (n: number) => string;
  num: (n: number) => string;
  date: (iso: string) => string;
  shortDate: (iso: string) => string;
};

export async function getI18n(): Promise<I18n> {
  const locale = await getLocale();
  const simple = await getSimpleMode();
  const t = makeTranslator(dictionaryFor(locale));
  return {
    locale,
    simple,
    t,
    money: (n) => formatMoney(n, locale),
    num: (n) => formatNumber(n, locale),
    date: (iso) => formatDate(iso, locale),
    shortDate: (iso) => formatShortDate(iso, locale),
  };
}
