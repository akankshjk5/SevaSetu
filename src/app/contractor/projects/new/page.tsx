import { currentContractor } from "@/lib/session";
import { ZONES } from "@/lib/seed";
import { getI18n } from "@/i18n/server";
import { BackLink } from "@/components/ui";
import { PhaseBanner } from "@/components/PhaseBadge";
import { NewProjectForm } from "./NewProjectForm";

export default async function NewProjectPage() {
  const contractor = (await currentContractor())!;
  const { t } = await getI18n();

  return (
    <div className="space-y-5">
      <BackLink href="/contractor" label={t("ct.nav.projects")} />
      <PhaseBanner phase={2} t={t} />
      <div>
        <h1 className="text-2xl font-extrabold">{t("ct.createProject")}</h1>
        <p className="text-sm text-slate-600">{t("ct.noProjectsBody")}</p>
      </div>
      <NewProjectForm zones={ZONES} defaultDistrict={contractor.district} />
    </div>
  );
}
