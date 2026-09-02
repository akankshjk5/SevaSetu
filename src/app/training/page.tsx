import Link from "next/link";
import { currentProvider } from "@/lib/session";
import { providerListings } from "@/lib/repo-phases";
import { publishListing } from "@/lib/actions-phases";
import { CATEGORIES } from "@/lib/categories";
import { ZONES } from "@/lib/seed";
import { getI18n } from "@/i18n/server";
import { Section } from "@/components/ui";
import { PhaseBanner } from "@/components/PhaseBadge";

export default async function TrainingHome({ searchParams }: { searchParams: Promise<{ published?: string }> }) {
  const sp = await searchParams;
  const provider = await currentProvider();
  if (!provider) return null;
  const { t, money } = await getI18n();
  const listings = providerListings(provider.id);

  return (
    <div className="space-y-6">
      <PhaseBanner phase={3} t={t} />

      <div>
        <h1 className="text-2xl font-extrabold">{provider.orgName}</h1>
        <p className="text-sm text-slate-600">{provider.about}</p>
      </div>

      {sp.published === "1" && (
        <p className="card border-teal-200 bg-teal-50 p-3 text-sm font-semibold text-teal-900">{t("common.saved")}</p>
      )}

      <Section
        title={`${t("tp.courses")} (${listings.length})`}
        action={
          <Link href="/training/gaps" className="-my-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand">
            {t("tp.gaps.title")}
          </Link>
        }
      >
        <ul className="space-y-3">
          {listings.map((l) => (
            <li key={l.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{l.title}</p>
                  <p className="text-xs text-slate-600">
                    {t(`cat.${l.trade}`)} · {l.district} · {l.durationDays} {t("tp.course.days")} · {l.seats}{" "}
                    {t("tp.course.seats")}
                  </p>
                </div>
                <span className="pill bg-teal-50 text-teal-800">{l.fee === 0 ? t("tp.course.free") : money(l.fee)}</span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{l.about}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("tp.addCourse")}>
        <form action={publishListing} className="card space-y-4 p-4">
          <label className="block text-sm font-semibold">
            {t("tp.course.title")}
            <input name="title" className="field mt-1" required />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              {t("tp.course.trade")}
              <select name="trade" className="field mt-1">
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t(`cat.${c.id}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              {t("tp.course.district")}
              <select name="district" defaultValue={provider.district} className="field mt-1">
                {ZONES.map((z) => (
                  <option key={z.name}>{z.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-semibold">
              {t("tp.course.days")}
              <input type="number" name="durationDays" min={1} defaultValue={14} className="field mt-1" />
            </label>
            <label className="block text-sm font-semibold">
              {t("tp.course.fee")}
              <input type="number" name="fee" min={0} defaultValue={0} className="field mt-1" />
            </label>
            <label className="block text-sm font-semibold">
              {t("tp.course.seats")}
              <input type="number" name="seats" min={1} defaultValue={25} className="field mt-1" />
            </label>
          </div>

          <label className="block text-sm font-semibold">
            {t("tp.course.about")}
            <textarea name="about" rows={3} className="field mt-1" />
          </label>

          <button className="btn btn-primary w-full">{t("tp.course.publish")}</button>
        </form>
      </Section>

      <p className="card bg-slate-50 p-4 text-xs text-slate-600">🔒 {t("tp.consentNote")}</p>
    </div>
  );
}
