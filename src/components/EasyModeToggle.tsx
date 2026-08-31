import { toggleSimpleMode } from "@/lib/actions";
import type { Translate } from "@/i18n";

/**
 * Easy mode switch. Deliberately labelled with a picture and one short word,
 * because the people most likely to need it are the least likely to read a
 * settings menu to find it.
 */
export function EasyModeToggle({ simple, t, tone = "light" }: { simple: boolean; t: Translate; tone?: "light" | "dark" }) {
  return (
    <form action={toggleSimpleMode}>
      <input type="hidden" name="on" value={simple ? "0" : "1"} />
      <button
        aria-pressed={simple}
        title={t("easy.explain")}
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition ${
          simple
            ? "bg-brand text-white"
            : tone === "dark"
              ? "text-white/85 ring-1 ring-white/30"
              : "text-slate-700 ring-1 ring-slate-300"
        }`}
      >
        <span aria-hidden className="text-base">
          👁
        </span>
        {t("easy.label")}
      </button>
    </form>
  );
}
