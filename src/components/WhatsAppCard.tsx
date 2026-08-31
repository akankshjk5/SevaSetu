import type { Translate } from "@/i18n";

/**
 * Shows the household exactly what reached the worker's WhatsApp, and offers a
 * wa.me link so the same message can be opened in real WhatsApp.
 *
 * The preview is the literal message body, not a paraphrase — if the two ever
 * differ, the bug is visible on screen rather than hidden in a provider log.
 */
export function WhatsAppCard({
  workerName,
  body,
  link,
  sentAt,
  t,
  dateLabel,
}: {
  workerName: string;
  body: string;
  link: string;
  sentAt?: string;
  t: Translate;
  dateLabel?: string;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between gap-3 bg-[#e7f7ee] p-4">
        <div className="flex items-start gap-3">
          <span aria-hidden className="text-2xl">
            💬
          </span>
          <div>
            <h2 className="font-bold">{t("wa.title")}</h2>
            <p className="text-xs text-slate-700">
              {sentAt ? t("wa.sentTo", { name: workerName }) : t("wa.notSent")}
              {sentAt && dateLabel ? ` · ${dateLabel}` : ""}
            </p>
          </div>
        </div>
        {sentAt && (
          <span className="pill bg-white text-teal-800 ring-1 ring-teal-200" aria-label={t("wa.sentTo", { name: workerName })}>
            ✔
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs font-semibold text-slate-500">{t("wa.preview")}</p>
        {/* The real message body, as the worker sees it in their language. */}
        <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
          {body}
        </pre>

        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          data-tap
          className="btn mt-3 w-full bg-[#25D366] text-white"
        >
          <span aria-hidden>💬</span> {sentAt ? t("wa.resend") : t("wa.send")}
        </a>
        <p className="mt-2 text-xs text-slate-500">{t("wa.demoNote")}</p>
      </div>
    </div>
  );
}
