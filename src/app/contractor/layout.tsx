import Link from "next/link";
import { redirect } from "next/navigation";
import { currentContractor } from "@/lib/session";
import { logout } from "@/lib/actions";
import { getI18n } from "@/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PhaseBadge } from "@/components/PhaseBadge";

const NAV = [
  { href: "/contractor", key: "ct.nav.projects", icon: "🏗️" },
  { href: "/contractor/projects/new", key: "ct.nav.newProject", icon: "➕" },
  { href: "/contractor/company", key: "ct.nav.company", icon: "🏢" },
];

export default async function ContractorLayout({ children }: { children: React.ReactNode }) {
  const contractor = await currentContractor();
  if (!contractor) redirect("/login?role=contractor");
  const { t, locale } = await getI18n();

  return (
    <div className="min-h-dvh pb-20">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/contractor" className="flex min-h-11 items-center gap-2 font-extrabold text-brand">
            <span aria-hidden>🪢</span> {t("app.name")}
            <PhaseBadge phase={2} t={t} />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} />
            <form action={logout}>
              <button className="min-h-11 text-sm font-semibold text-slate-600">{t("common.logout")}</button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white">
        <ul className="mx-auto flex max-w-4xl">
          {NAV.map((n) => (
            <li key={n.href} className="flex-1">
              <Link
                href={n.href}
                data-tap
                className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-center text-[11px] leading-tight font-semibold break-words hyphens-auto text-slate-600"
              >
                <span aria-hidden className="text-lg">
                  {n.icon}
                </span>
                {t(n.key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
