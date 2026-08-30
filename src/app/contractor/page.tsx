import Link from "next/link";
import { currentContractor } from "@/lib/session";
import { contractorProjects, projectAssignments, projectWages } from "@/lib/repo-phases";
import { getI18n } from "@/i18n/server";
import { EmptyState, Section } from "@/components/ui";
import { PhaseBanner } from "@/components/PhaseBadge";

const STATUS_CLASS: Record<string, string> = {
  planning: "bg-slate-100 text-slate-700",
  hiring: "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
  running: "bg-blue-50 text-blue-800 ring-1 ring-blue-200",
  completed: "bg-teal-50 text-teal-800 ring-1 ring-teal-200",
};

export default async function ContractorHome() {
  const contractor = (await currentContractor())!;
  const { t, money, shortDate } = await getI18n();
  const projects = contractorProjects(contractor.id);

  return (
    <div className="space-y-6">
      <PhaseBanner phase={2} t={t} />

      <div>
        <h1 className="text-2xl font-extrabold">{t("ct.hello", { name: contractor.contactName.split(" ")[0] })}</h1>
        <p className="text-sm text-slate-600">
          {contractor.companyName} · {contractor.district}
        </p>
      </div>

      <Section
        title={t("ct.activeProjects")}
        action={
          <Link href="/contractor/projects/new" className="-my-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand">
            {t("ct.createProject")}
          </Link>
        }
      >
        {projects.length === 0 ? (
          <EmptyState
            title={t("ct.noProjects")}
            body={t("ct.noProjectsBody")}
            cta={
              <Link href="/contractor/projects/new" data-tap className="btn btn-primary">
                {t("ct.createProject")}
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {projects.map((p) => {
              const team = projectAssignments(p.id);
              const confirmed = team.filter((a) => a.status === "confirmed" || a.status === "completed").length;
              const needed = p.requirements.reduce((s, r) => s + r.count, 0);
              const wages = projectWages(p.id);
              return (
                <li key={p.id}>
                  <Link href={`/contractor/projects/${p.id}`} className="card block p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-xs text-slate-600">
                          {p.siteAddress} · {shortDate(p.startDate)} · {p.durationDays} {t("ct.project.duration")}
                        </p>
                      </div>
                      <span className={`pill ${STATUS_CLASS[p.status]}`}>{t(`ct.project.status.${p.status}`)}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {p.requirements.map((r) => (
                        <span key={r.trade} className="pill bg-slate-100 text-slate-700">
                          {t(`cat.${r.trade}`)} × {r.count} · {money(r.dailyRate)}
                        </span>
                      ))}
                    </div>

                    <p className="mt-3 text-sm text-slate-700">
                      {t("ct.project.team")}: <strong>{confirmed}</strong>/{needed} ·{" "}
                      {t("ct.project.totalWages")}: <strong>{money(wages.total)}</strong>
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <p className="card bg-teal-50 p-4 text-sm text-slate-700">🔁 {t("ct.sharedEngine")}</p>
    </div>
  );
}
