import Link from "next/link";
import { currentHousehold } from "@/lib/session";
import { db } from "@/lib/store";
import { ZONES } from "@/lib/seed";
import { CATEGORY_MAP, priceUnitKey } from "@/lib/categories";
import { scoreWorker } from "@/lib/match";
import { isCertified } from "@/lib/repo-phases";
import { getI18n } from "@/i18n/server";
import type { CategoryId } from "@/lib/types";
import { BackLink, CertifiedBadge, Stars, VerifiedBadge, daysLabel } from "@/components/ui";
import { WorkerAvatar } from "@/components/WorkerAvatar";

type SP = Record<string, string | undefined>;

const SORTS = ["match", "price", "rating", "distance"] as const;

export default async function MatchesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const household = await currentHousehold();
  if (!household) return null;
  const { t, money } = await getI18n();

  const category = (sp.category ?? "cleaner") as CategoryId;
  const cat = CATEGORY_MAP[category];
  const type = sp.type ?? "recurring";
  const days = (sp.days ?? "1,2,3,4,5,6").split(",").filter(Boolean).map(Number);
  const date = sp.date ?? new Date().toISOString().slice(0, 10);
  const time = sp.time ?? "08:00";
  const duration = Number(sp.duration ?? 90);
  const locality = sp.locality ?? household.locality;
  const address = sp.address ?? household.addressLine;
  const budget = Number(sp.budget ?? cat.typicalPrice);
  const sort = sp.sort ?? "match";
  const verifiedOnly = sp.verifiedOnly !== "0";
  const certifiedOnly = sp.certifiedOnly === "1";

  const zone = ZONES.find((z) => z.name === locality) ?? ZONES[0];
  const location = { lat: zone.lat, lng: zone.lng };

  let matches = db()
    .workers.filter((w) => w.categories.includes(category) && w.status !== "suspended")
    .filter((w) => (verifiedOnly ? w.verified : true))
    .filter((w) => (certifiedOnly ? isCertified(w.id) : true))
    .map((w) => scoreWorker(w, { category, location, days, time, budget }));

  matches = matches.sort((a, b) => {
    if (sort === "price") return a.worker.wage - b.worker.wage;
    if (sort === "rating") return b.worker.rating - a.worker.rating;
    if (sort === "distance") return a.distanceKm - b.distanceKm;
    return b.score - a.score;
  });

  const carry = new URLSearchParams({
    category,
    type,
    days: days.join(","),
    date,
    time,
    duration: String(duration),
    locality,
    address,
    budget: String(budget),
  });
  const withParam = (k: string, v: string) => {
    const p = new URLSearchParams(carry);
    p.set("sort", sort);
    p.set("verifiedOnly", verifiedOnly ? "1" : "0");
    p.set("certifiedOnly", certifiedOnly ? "1" : "0");
    p.set(k, v);
    return `/household/matches?${p.toString()}`;
  };

  const durationLabel = duration >= 60 ? `${duration / 60} hr` : `${duration} min`;

  return (
    <div className="space-y-4">
      <BackLink href="/household/post" label={t("hh.post.title")} />

      <div>
        <h1 className="text-xl font-extrabold">{t("hh.matches.title", { n: matches.length })}</h1>
        <p className="text-sm text-slate-600">
          {t(`cat.${category}`)} · {type === "one-time" ? t("hh.type.one-time") : daysLabel(days, t)} · {time} ·{" "}
          {durationLabel} · {money(budget)} {t(priceUnitKey(cat.priceUnit))}
        </p>
        <p className="text-xs text-slate-500">{t("hh.matches.sub")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {SORTS.map((s) => (
          <Link
            key={s}
            href={withParam("sort", s)}
            data-tap
            className={`pill ${sort === s ? "bg-brand text-white" : "bg-white text-slate-700 ring-1 ring-slate-300"}`}
          >
            {t(`hh.matches.sort.${s}`)}
          </Link>
        ))}
        <Link
          href={withParam("verifiedOnly", verifiedOnly ? "0" : "1")}
          data-tap
          aria-pressed={verifiedOnly}
          className={`pill ${verifiedOnly ? "bg-teal-50 text-teal-800 ring-1 ring-teal-300" : "bg-white text-slate-700 ring-1 ring-slate-300"}`}
        >
          🛡️ {t("hh.matches.verifiedOnly")} {verifiedOnly ? "✓" : ""}
        </Link>
        <Link
          href={withParam("certifiedOnly", certifiedOnly ? "0" : "1")}
          data-tap
          aria-pressed={certifiedOnly}
          className={`pill ${certifiedOnly ? "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-300" : "bg-white text-slate-700 ring-1 ring-slate-300"}`}
        >
          🎓 {t("hh.matches.certifiedOnly")} {certifiedOnly ? "✓" : ""}
        </Link>
      </div>

      <ul className="space-y-3">
        {matches.map((m) => {
          const w = m.worker;
          const p = new URLSearchParams(carry);
          p.set("price", String(w.wage));
          const parts = [
            { k: t("hh.matches.skillFit"), v: m.breakdown.skill, max: 30 },
            { k: t("hh.matches.distance"), v: m.breakdown.distance, max: 25 },
            { k: t("hh.matches.rating"), v: m.breakdown.rating, max: 20 },
            { k: t("hh.matches.price"), v: m.breakdown.price, max: 15 },
            { k: t("hh.matches.availability"), v: m.breakdown.availability, max: 10 },
          ];
          return (
            <li key={w.id} className="card p-4">
              <div className="flex gap-3">
                <WorkerAvatar id={w.id} name={w.name} trade={category} photo={w.photo} size={56} ring />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{w.name}</p>
                      <p className="text-xs text-slate-600">
                        {w.locality} · {t("common.km", { n: m.distanceKm })} ·{" "}
                        {t("common.years", { n: w.experienceYears })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold">{money(w.wage)}</p>
                      <p className="text-[11px] text-slate-600">{t(priceUnitKey(cat.priceUnit))}</p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Stars rating={w.rating} count={w.jobsCompleted} t={t} />
                    {w.verified ? <VerifiedBadge t={t} compact /> : <span className="pill bg-amber-50 text-amber-800">{t("badge.unverified")}</span>}
                    {isCertified(w.id) && <CertifiedBadge t={t} />}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{t("hh.matches.matchScore")}</span>
                  <span className="text-brand">{m.score}/100</span>
                </div>
                <div className="mt-2 flex gap-1">
                  {parts.map((part) => (
                    <span key={part.k} className="flex-1">
                      <span className="block h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <span
                          className="block h-full rounded-full bg-brand"
                          style={{ width: `${(part.v / part.max) * 100}%` }}
                        />
                      </span>
                      <span className="mt-1 block text-[10px] leading-tight text-slate-500">{part.k}</span>
                    </span>
                  ))}
                </div>
                {m.reasons.length > 0 && <p className="mt-2 text-xs text-slate-700">{m.reasons.map((r) => t(r.key, r.vars)).join(" · ")}</p>}
              </div>

              <div className="mt-3 flex gap-2">
                <Link href={`/household/workers/${w.id}?${p.toString()}`} data-tap className="btn btn-ghost flex-1">
                  {t("hh.matches.viewProfile")}
                </Link>
                <Link href={`/household/workers/${w.id}?${p.toString()}#book`} data-tap className="btn btn-primary flex-1">
                  {t("hh.matches.book")}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {matches.length === 0 && (
        <div className="card p-6 text-center">
          <p className="font-semibold">{t("hh.matches.none")}</p>
          <p className="mt-1 text-sm text-slate-600">{t("hh.matches.noneBody")}</p>
        </div>
      )}
    </div>
  );
}
