import { currentContractor } from "@/lib/session";
import { saveCompanyProfile } from "@/lib/actions-phases";
import { ZONES } from "@/lib/seed";
import { getI18n } from "@/i18n/server";
import { Stars } from "@/components/ui";
import { PhaseBadge } from "@/components/PhaseBadge";

export default async function CompanyPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const contractor = (await currentContractor())!;
  const { t } = await getI18n();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">{t("ct.company.title")}</h1>
        <PhaseBadge phase={2} t={t} />
      </div>

      {sp.saved === "1" && (
        <p className="card border-teal-200 bg-teal-50 p-3 text-sm font-semibold text-teal-900">{t("common.saved")}</p>
      )}

      <div className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold">{contractor.companyName}</p>
            <p className="text-xs text-slate-600">
              {contractor.projectsCompleted} {t("ct.nav.projects")}
            </p>
          </div>
          <Stars rating={contractor.rating} count={contractor.ratingCount} t={t} />
        </div>
        <p className="mt-2 text-xs text-slate-600">{t("ct.project.rateSub")}</p>
      </div>

      <form action={saveCompanyProfile} className="card space-y-4 p-4">
        <label className="block text-sm font-semibold">
          {t("ct.company.name")}
          <input name="companyName" defaultValue={contractor.companyName} className="field mt-1" required />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            {t("ct.company.contact")}
            <input name="contactName" defaultValue={contractor.contactName} className="field mt-1" />
          </label>
          <label className="block text-sm font-semibold">
            {t("ct.company.gst")}
            <input name="gst" defaultValue={contractor.gst} className="field mt-1" />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          {t("ct.project.site")}
          <select name="district" defaultValue={contractor.district} className="field mt-1">
            {ZONES.map((z) => (
              <option key={z.name}>{z.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          {t("ct.company.about")}
          <textarea name="about" rows={3} defaultValue={contractor.about} className="field mt-1" />
        </label>
        <button className="btn btn-primary w-full">{t("common.save")}</button>
      </form>
    </div>
  );
}
