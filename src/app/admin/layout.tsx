import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { logout } from "@/lib/actions";
import { getI18n } from "@/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const NAV = [
  { href: "/admin", key: "ad.nav.overview" },
  { href: "/admin/verification", key: "ad.nav.verification" },
  { href: "/admin/disputes", key: "ad.nav.disputes" },
  { href: "/admin/reviews", key: "ad.nav.reviews" },
  { href: "/admin/analytics", key: "ad.nav.analytics" },
  { href: "/admin/inquiries", key: "ad.nav.inquiries" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user || user.role !== "admin") redirect("/login?role=admin");
  const { t, locale } = await getI18n();

  return (
    <div className="min-h-dvh">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin" className="font-extrabold">
              🪢 {t("app.name")} <span className="font-normal text-slate-300">{t("role.admin")}</span>
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <LanguageSwitcher locale={locale} tone="dark" />
            <Link href="/gov" className="font-semibold text-slate-200 underline">
              {t("role.government")}
            </Link>
            <form action={logout}>
              <button className="min-h-11 font-semibold text-slate-200">{t("common.logout")}</button>
            </form>
          </div>
        </div>
        <nav className="border-t border-slate-800">
          <ul className="mx-auto flex max-w-6xl flex-wrap gap-1 px-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} data-tap className="inline-flex px-3 py-2 text-sm font-semibold text-slate-200">
                  {t(n.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
