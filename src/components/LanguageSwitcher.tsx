import { setLanguage } from "@/lib/actions";
import { LOCALES, LOCALE_META, type Locale } from "@/i18n/config";

/**
 * Visible on every screen, including the first one a new user sees. Posts to a
 * server action so the choice is stored on the profile as well as the cookie.
 */
export function LanguageSwitcher({ locale, tone = "light" }: { locale: Locale; tone?: "light" | "dark" }) {
  return (
    <form action={setLanguage} className="flex items-center gap-1">
      <span className="sr-only" id="lang-label">
        {LOCALE_META[locale].label}
      </span>
      {LOCALES.map((l) => (
        <button
          key={l}
          name="locale"
          value={l}
          aria-label={LOCALE_META[l].label}
          aria-current={l === locale}
          lang={l}
          className={`min-h-11 min-w-11 rounded-full px-2.5 py-1 text-xs font-bold transition ${
            l === locale
              ? tone === "dark"
                ? "bg-white text-slate-900"
                : "bg-brand text-white"
              : tone === "dark"
                ? "text-white/80 ring-1 ring-white/30"
                : "text-slate-600 ring-1 ring-slate-300"
          }`}
        >
          {LOCALE_META[l].short}
        </button>
      ))}
    </form>
  );
}
