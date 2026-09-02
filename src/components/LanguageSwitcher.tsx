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
          className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full text-[11px] sm:text-xs font-bold transition flex items-center justify-center shrink-0 cursor-pointer ${
            l === locale
              ? tone === "dark"
                ? "bg-white text-slate-900 shadow-2xs"
                : "bg-brand text-white shadow-2xs"
              : tone === "dark"
                ? "text-white/80 ring-1 ring-white/20 hover:bg-white/10"
                : "text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          {LOCALE_META[l].short}
        </button>
      ))}
    </form>
  );
}
