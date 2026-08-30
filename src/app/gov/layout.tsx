import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { logout } from "@/lib/actions";
import { getI18n } from "@/i18n/server";
import { CITY } from "@/lib/seed";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function GovLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user || (user.role !== "government" && user.role !== "admin")) redirect("/login?role=government");
  const { t, locale } = await getI18n();

  return (
    <div className="min-h-dvh bg-gov-soft">
      {/* Deliberately official, and visually unlike the consumer apps. */}
      <header className="border-b-4 border-amber-400 bg-gov text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs tracking-widest text-blue-100 uppercase">
              {t("role.government")} · {CITY}
            </p>
            <h1 className="text-lg font-bold">{t("gov.title")}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <LanguageSwitcher locale={locale} tone="dark" />
            <span className="rounded bg-white/15 px-3 py-1 font-semibold">{t("gov.readOnly")}</span>
            <Link href="/partners" className="inline-flex min-h-10 items-center font-semibold underline">
              {t("pt.nav")}
            </Link>
            <form action={logout}>
              <button className="min-h-10 font-semibold underline">{t("common.logout")}</button>
            </form>
          </div>
        </div>
      </header>

      {/* The compliance line, on every screen of this view. */}
      <div className="border-b border-amber-300 bg-amber-100">
        <p className="mx-auto max-w-6xl px-4 py-2 text-sm font-semibold text-amber-950">
          🔒 {t("gov.aggregatedOnly")}
        </p>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-600">
        <p>{t("gov.aggregatedExplain")}</p>
        <p className="mt-2">{t("pt.gov.4.d")}</p>
      </footer>
    </div>
  );
}
