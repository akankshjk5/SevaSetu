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
        <Link href="/" className="flex min-h-11 items-center gap-2 font-extrabold text-brand">
          <span aria-hidden className="text-xl">🪢</span> {t("app.name")}
        </Link>
        {/* Language choice is available on the very first screen. */}
        <LanguageSwitcher locale={locale} />
      </div>

      <div className="mt-8">
        <h1 className="text-2xl font-extrabold">{t(`login.title.${role}`)}</h1>
        <p className="mt-1 text-sm text-slate-600">{t(`login.sub.${role}`)}</p>
      </div>

      <div className="mt-5 flex gap-2 text-sm">
        {(["household", "worker"] as const).map((r) => (
          <Link key={r} href={`/login?role=${r}`} data-tap className={`btn flex-1 ${role === r ? "btn-primary" : "btn-ghost"}`}>
            {r === "household" ? t("login.iNeedHelp") : t("login.iWantWork")}
          </Link>
        ))}
      </div>

      {sp.error && (
        <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 ring-1 ring-rose-200">
          {sp.error}
        </p>
      )}

      {!sent ? (
        <form action={startLogin} className="card mt-4 space-y-3 p-4">
          <input type="hidden" name="role" value={role} />
          {sp.next && <input type="hidden" name="next" value={sp.next} />}
          <label className="block text-sm font-semibold" htmlFor="phone">
            {t("login.mobile")}
          </label>
          <div className="flex items-center gap-2">
            <span className="pill bg-slate-100 text-slate-700">+91</span>
            <input
              id="phone"
              name="phone"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              placeholder="98765 43210"
              className="field"
              required
            />
          </div>
          <button className="btn btn-primary w-full">{t("login.sendCode")}</button>
          <p className="text-xs text-slate-500">{t("common.demoNote")}</p>
        </form>
      ) : (
        <form action={completeLogin} className="card mt-4 space-y-3 p-4">
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="phone" value={sp.phone ?? ""} />
          {sp.next && <input type="hidden" name="next" value={sp.next} />}
          <p className="text-sm text-slate-600">
            {t("login.codeSentTo", { phone: `+91 ${sp.phone ?? ""}` })}{" "}
            <Link href={`/login?role=${role}`} className="font-semibold text-brand">
              {t("login.change")}
            </Link>
          </p>
          <label className="block text-sm font-semibold" htmlFor="code">
            {t("login.codeLabel")}
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            className="field tracking-[0.4em]"
            required
          />
          <p className="text-xs text-slate-500">{t("login.hint")}</p>

          <details open={sp.needsName === "1"} className="rounded-xl bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-semibold">{t("login.newHere")}</summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-sm font-semibold" htmlFor="name">
                  {t("login.yourName")}
                </label>
                <input id="name" name="name" className="field mt-1" />
              </div>
              <div>
                <label className="block text-sm font-semibold" htmlFor="locality">
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

          <button className="btn btn-primary w-full">{t("login.verify")}</button>
        </form>
      )}

      <div className="mt-auto pt-8">
        <p className="text-xs font-semibold text-slate-500">{t("login.demoAccounts")}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {DEMOS.map((d) => (
            <form key={d.role} action={demoLogin}>
              <input type="hidden" name="role" value={d.role} />
              <input type="hidden" name="userId" value={d.userId} />
              <button className="btn btn-ghost w-full flex-col !items-start gap-1 text-left text-sm">
                <span className="font-semibold">{t(`role.${d.role}`)}</span>
                <PhaseBadge phase={d.phase} t={t} />
              </button>
            </form>
          ))}
        </div>
      </div>
    </main>
  );
}
