import { getI18n } from "@/i18n/server";
import { BackLink } from "@/components/ui";

const POINTS = [
  { icon: "💰", n: 1 },
  { icon: "🛡️", n: 2 },
  { icon: "📅", n: 3 },
  { icon: "🆓", n: 4 },
  { icon: "⭐", n: 5 },
];

export default async function WhyPlatformPage() {
  const { t } = await getI18n();
  return (
    <div className="space-y-5">
      <BackLink href="/worker" label={t("wk.nav.home")} />
      <div>
        <h1 className="text-2xl font-extrabold">{t("wk.why.title")}</h1>
      </div>

      <ul className="space-y-3">
        {POINTS.map((p) => (
          <li key={p.n} className="card flex gap-3 p-4">
            <span aria-hidden className="text-2xl">
              {p.icon}
            </span>
            <span>
              <span className="block font-bold">{t(`wk.why.${p.n}.t`)}</span>
              <span className="block text-sm text-slate-600">{t(`wk.why.${p.n}.d`)}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="card bg-teal-50 p-4">
        <p className="font-bold">{t("hh.protection.title")}</p>
        <p className="mt-1 text-sm text-slate-700">{t("hh.protection.cashNote")}</p>
      </div>
    </div>
  );
}
