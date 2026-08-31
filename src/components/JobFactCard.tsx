import { Avatar } from "@/components/ui";
import { SpeakButton } from "@/components/SpeakButton";
import type { Translate } from "@/i18n";

/**
 * The five facts a worker actually needs, in the order they ask them:
 * who called me, what work, when, where, how much.
 *
 * Every row leads with a picture, so the card can be understood by scanning
 * icons and numbers alone — the words are support, not the whole message.
 */
export type JobFacts = {
  whoName: string;
  whoSub?: string;
  what: string;
  whatIcon: string;
  when: string;
  where: string;
  amount: string;
  amountSub?: string;
};

export function JobFactCard({ facts, t, speakable = true }: { facts: JobFacts; t: Translate; speakable?: boolean }) {
  const rows = [
    { icon: "👤", label: t("easy.who"), value: facts.whoName, sub: facts.whoSub },
    { icon: facts.whatIcon, label: t("easy.what"), value: facts.what },
    { icon: "🕐", label: t("easy.when"), value: facts.when },
    { icon: "📍", label: t("easy.where"), value: facts.where },
  ];

  // What the listen button reads out, in the order above.
  const spoken = [
    `${t("easy.who")}: ${facts.whoName}`,
    `${t("easy.what")}: ${facts.what}`,
    `${t("easy.when")}: ${facts.when}`,
    `${t("easy.where")}: ${facts.where}`,
    `${t("easy.howMuch")}: ${facts.amount}`,
  ].join(". ");

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 bg-marigold-soft/60 p-4">
        <Avatar name={facts.whoName} size={48} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wide text-amber-900 uppercase">{t("easy.appointedBy")}</p>
          <p className="truncate text-lg font-extrabold">{facts.whoName}</p>
          {facts.whoSub && <p className="truncate text-sm text-slate-700">{facts.whoSub}</p>}
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {rows.slice(1).map((r) => (
          <li key={r.label} className="flex items-center gap-3 p-4">
            <span aria-hidden className="icon-tile shrink-0">
              {r.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-slate-500">{r.label}</span>
              <span className="block font-bold break-words">{r.value}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-teal-50/60 p-4">
        <span>
          <span className="block text-xs font-semibold text-slate-500">{t("easy.howMuch")}</span>
          <span className="block text-2xl font-extrabold text-brand">{facts.amount}</span>
          {facts.amountSub && <span className="block text-xs text-slate-600">{facts.amountSub}</span>}
        </span>
        {speakable && <SpeakButton text={spoken} />}
      </div>
    </div>
  );
}
