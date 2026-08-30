import { getI18n } from "@/i18n/server";
import { BackLink } from "@/components/ui";
import { ProtectionPanel } from "@/components/protection";

const FAQ = ["faq1", "faq2", "faq3", "faq4", "faq5"] as const;

export default async function ProtectionPage() {
  const { t } = await getI18n();
  return (
    <div className="space-y-5">
      <BackLink href="/household" label={t("hh.nav.home")} />
      <div>
        <h1 className="text-2xl font-extrabold">{t("hh.protection.title")}</h1>
        <p className="text-sm text-slate-600">{t("hh.protection.activeOn")}</p>
      </div>

      <ProtectionPanel covered compact t={t} />

      <ul className="space-y-3">
        {FAQ.map((f) => (
          <li key={f} className="card p-4">
            <p className="font-semibold">{t(`hh.protection.${f}.q`)}</p>
            <p className="mt-1 text-sm text-slate-700">{t(`hh.protection.${f}.a`)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
