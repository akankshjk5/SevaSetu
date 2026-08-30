import Link from "next/link";
import { redirect } from "next/navigation";
import { currentProvider } from "@/lib/session";
import { logout } from "@/lib/actions";
import { getI18n } from "@/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PhaseBadge } from "@/components/PhaseBadge";

export default async function TrainingLayout({ children }: { children: React.ReactNode }) {
  const provider = await currentProvider();
  if (!provider) redirect("/login?role=training");
  const { t, locale } = await getI18n();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/training" className="flex min-h-11 items-center gap-2 font-extrabold text-brand">
            <span aria-hidden>🪢</span> {t("tp.title")}
            <PhaseBadge phase={3} t={t} />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <LanguageSwitcher locale={locale} />
            <Link href="/training/gaps" className="inline-flex min-h-11 items-center font-semibold text-slate-600">
              {t("tp.nav.gaps")}
            </Link>
            <form action={logout}>
              <button className="min-h-11 font-semibold text-slate-600">{t("common.logout")}</button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
