/**
 * Language layer configuration.
 *
 * Adding a fourth language is a two-line change here plus one new pack file in
 * `dictionaries/` — no component ever needs to be touched, because every
 * user-facing string in the app goes through `t()`.
 */
export const LOCALES = ["en", "hi", "kn"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_META: Record<Locale, { label: string; nativeLabel: string; intl: string; short: string }> = {
  en: { label: "English", nativeLabel: "English", intl: "en-IN", short: "EN" },
  hi: { label: "Hindi", nativeLabel: "हिन्दी", intl: "hi-IN", short: "हि" },
  kn: { label: "Kannada", nativeLabel: "ಕನ್ನಡ", intl: "kn-IN", short: "ಕ" },
};

export const LANG_COOKIE = "swp_lang";
export const SIMPLE_COOKIE = "swp_simple";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
