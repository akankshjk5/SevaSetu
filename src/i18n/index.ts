import en from "./dictionaries/en";
import hi from "./dictionaries/hi";
import kn from "./dictionaries/kn";
import { DEFAULT_LOCALE, LOCALE_META, type Locale } from "./config";

export type Dict = Record<string, string>;
export type TKey = keyof typeof en;

/** One entry per language pack. Adding a language = add a file and a line. */
const PACKS: Record<Locale, Dict> = {
  en: en as Dict,
  hi: hi as Dict,
  kn: kn as Dict,
};

/** Merged over English so a partial pack can never produce an empty screen. */
export function dictionaryFor(locale: Locale): Dict {
  return locale === DEFAULT_LOCALE ? PACKS[DEFAULT_LOCALE] : { ...PACKS[DEFAULT_LOCALE], ...PACKS[locale] };
}

export type Translate = (key: TKey | (string & {}), vars?: Record<string, string | number>) => string;

export function makeTranslator(dict: Dict): Translate {
  return (key, vars) => {
    const raw = dict[key as string] ?? (en as Dict)[key as string] ?? (key as string);
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (m, name) => (vars[name] !== undefined ? String(vars[name]) : m));
  };
}

// ---------------------------------------------------------------- formats --

export function formatMoney(n: number, locale: Locale) {
  return new Intl.NumberFormat(LOCALE_META[locale].intl, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumber(n: number, locale: Locale) {
  return new Intl.NumberFormat(LOCALE_META[locale].intl).format(n);
}

export function formatDate(iso: string, locale: Locale, opts?: Intl.DateTimeFormatOptions) {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return new Intl.DateTimeFormat(
    LOCALE_META[locale].intl,
    opts ?? { day: "numeric", month: "short", year: "numeric" },
  ).format(d);
}

export function formatShortDate(iso: string, locale: Locale) {
  return formatDate(iso, locale, { day: "numeric", month: "short" });
}

export function formatMonth(period: string, locale: Locale) {
  return formatDate(`${period}-01`, locale, { month: "long", year: "numeric" });
}
