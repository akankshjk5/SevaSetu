import Link from "next/link";
import { completeLogin, demoLogin, startLogin } from "@/lib/actions";
import { ZONES, CITY } from "@/lib/seed";
import { getI18n } from "@/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PhaseBadge, type Phase } from "@/components/PhaseBadge";
import type { Role } from "@/lib/types";

const DEMOS: { role: Role; userId: string; phase: Phase }[] = [
  { role: "household", userId: "u_h1", phase: 1 },
  { role: "worker", userId: "u_w1", phase: 1 },
  { role: "contractor", userId: "u_c1", phase: 2 },
  { role: "training", userId: "u_tp1", phase: 3 },
  { role: "admin", userId: "u_admin", phase: 1 },
  { role: "government", userId: "u_gov", phase: 5 },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    phone?: string;
    sent?: string;
    error?: string;
    hint?: string;
    needsName?: string;
    next?: string;
  }>;
}) {
  const sp = await searchParams;
  const { t, locale } = await getI18n();
  const role = (sp.role ?? "household") as Role;
  const sent = sp.sent === "1";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="flex min-h-11 items-center gap-2 font-black text-xl text-teal-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-lg ring-1 ring-teal-200">
            🪢
          </span>
          <span>{t("app.name")}</span>
        </Link>
        <LanguageSwitcher locale={locale} />
      </div>

      {/* Social Proof Trust Stack */}
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-900/10 bg-white p-3 shadow-xs">
        <div className="flex -space-x-2 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/workers/w1.jpg"
            alt="Sunita"
            className="inline-block h-8 w-8 rounded-full object-cover ring-2 ring-white"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/workers/w3.jpg"
            alt="Ramesh"
            className="inline-block h-8 w-8 rounded-full object-cover ring-2 ring-white"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/workers/w2.jpg"
            alt="Kamla"
            className="inline-block h-8 w-8 rounded-full object-cover ring-2 ring-white"
          />
        </div>
        <div className="text-xs">
          <p className="font-bold text-slate-800">Verified Local Workforce in {CITY}</p>
          <p className="text-slate-500">100% Police checked & skill certified</p>
        </div>
      </div>

      <div className="mt-6">
        <h1 className="text-2xl font-black text-slate-900">{t(`login.title.${role}`)}</h1>
        <p className="mt-1 text-sm text-slate-600">{t(`login.sub.${role}`)}</p>
      </div>

      <div className="mt-5 flex gap-2 rounded-xl bg-slate-100 p-1 text-sm font-bold">
        {(["household", "worker"] as const).map((r) => (
          <Link
            key={r}
            href={`/login?role=${r}`}
            data-tap
            className={`flex-1 rounded-lg py-2.5 text-center transition ${
              role === r
                ? "bg-white text-slate-900 shadow-xs ring-1 ring-black/5"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {r === "household" ? `🏠 ${t("login.iNeedHelp")}` : `🧹 ${t("login.iWantWork")}`}
          </Link>
        ))}
      </div>

      {sp.error && (
        <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 ring-1 ring-rose-200">
          {sp.error}
        </p>
      )}

      {!sent ? (
        <form action={startLogin} className="card mt-4 space-y-3.5 p-5 shadow-sm">
          <input type="hidden" name="role" value={role} />
          {sp.next && <input type="hidden" name="next" value={sp.next} />}
          <label className="block text-sm font-bold text-slate-800" htmlFor="phone">
            {t("login.mobile")}
          </label>
          <div className="flex items-center gap-2">
            <span className="pill bg-slate-100 font-bold text-slate-700">+91</span>
            <input
              id="phone"
              name="phone"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              placeholder="98765 43210"
              className="field font-semibold text-base"
              required
            />
          </div>
          <button className="btn btn-primary w-full !py-3 !font-bold text-base shadow-sm">
            {t("login.sendCode")} →
          </button>
          <p className="text-xs text-slate-500 text-center">{t("common.demoNote")}</p>
        </form>
      ) : (
        <form action={completeLogin} className="card mt-4 space-y-3.5 p-5 shadow-sm">
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="phone" value={sp.phone ?? ""} />
          {sp.next && <input type="hidden" name="next" value={sp.next} />}
          <p className="text-sm text-slate-600">
            {t("login.codeSentTo", { phone: `+91 ${sp.phone ?? ""}` })}{" "}
            <Link href={`/login?role=${role}`} className="font-bold text-teal-800 underline">
              {t("login.change")}
            </Link>
          </p>
          <label className="block text-sm font-bold text-slate-800" htmlFor="code">
            {t("login.codeLabel")}
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            className="field text-center font-black tracking-[0.5em] text-xl"
            required
          />
          <p className="text-xs text-slate-500">{t("login.hint")}</p>

          <details open={sp.needsName === "1"} className="rounded-xl bg-slate-50 p-3.5">
            <summary className="cursor-pointer text-sm font-bold text-slate-800">{t("login.newHere")}</summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="name">
                  {t("login.yourName")}
                </label>
                <input id="name" name="name" className="field mt-1" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="locality">
                  {t("login.area", { city: CITY })}
                </label>
                <select id="locality" name="locality" className="field mt-1">
                  {ZONES.map((z) => (
                    <option key={z.name}>{z.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </details>

          <button className="btn btn-primary w-full !py-3 !font-bold text-base shadow-sm">
            {t("login.verify")} →
          </button>
        </form>
      )}

      {/* Demo Access Section */}
      <div className="mt-auto pt-8">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("login.demoAccounts")}</p>
          <span className="text-[11px] font-semibold text-teal-800">1-Click Login</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { role: "household", userId: "u_h1", phase: 1 as Phase, icon: "🏠" },
            { role: "worker", userId: "u_w1", phase: 1 as Phase, icon: "🧹" },
            { role: "contractor", userId: "u_c1", phase: 2 as Phase, icon: "🏗️" },
            { role: "training", userId: "u_tp1", phase: 3 as Phase, icon: "🎓" },
            { role: "admin", userId: "u_admin", phase: 1 as Phase, icon: "⚙️" },
            { role: "government", userId: "u_gov", phase: 5 as Phase, icon: "🏛️" },
          ].map((d) => (
            <form key={d.role} action={demoLogin}>
              <input type="hidden" name="role" value={d.role} />
              <input type="hidden" name="userId" value={d.userId} />
              <button
                type="submit"
                className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-left shadow-xs transition hover:border-teal-500 hover:shadow-xs active:scale-97 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate group-hover:text-teal-800">
                    {d.icon} {t(`role.${d.role}`)}
                  </p>
                </div>
                <PhaseBadge phase={d.phase} t={t} />
              </button>
            </form>
          ))}
        </div>
      </div>
    </main>
  );
}
