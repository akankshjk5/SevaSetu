import { partnershipInquiries } from "@/lib/repo-phases";
import { markInquiryContacted } from "@/lib/actions-phases";
import { getI18n } from "@/i18n/server";
import { PhaseBadge } from "@/components/PhaseBadge";

export default async function InquiriesPage() {
  const { t, date: fmtDate } = await getI18n();
  const inquiries = partnershipInquiries();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t("ad.inquiries.title")}</h1>
          <p className="text-sm text-slate-600">{t("pt.form.thanksBody")}</p>
        </div>
        <PhaseBadge phase={5} t={t} full />
      </div>

      {inquiries.length === 0 && <p className="card p-6 text-sm text-slate-600">{t("ad.inquiries.empty")}</p>}

      <ul className="space-y-3">
        {inquiries.map((i) => (
          <li key={i.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">{t("ad.inquiries.from", { name: i.name, department: i.department })}</p>
                <p className="text-xs text-slate-600">
                  {i.state} · {i.email} · {fmtDate(i.createdAt)}
                </p>
              </div>
              <span
                className={`pill ${
                  i.status === "new"
                    ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                    : "bg-teal-50 text-teal-800 ring-1 ring-teal-200"
                }`}
              >
                {i.status === "new" ? t("phase.live") : t("ad.disputes.resolved")}
              </span>
            </div>
            <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{i.message}</p>
            {i.status === "new" && (
              <form action={markInquiryContacted} className="mt-3">
                <input type="hidden" name="inquiryId" value={i.id} />
                <button className="btn btn-ghost">{t("ad.disputes.resolve")}</button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
