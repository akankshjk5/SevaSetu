import Link from "next/link";
import { redirect } from "next/navigation";
import { currentWorker } from "@/lib/session";
import { logout } from "@/lib/actions";
import { getI18n } from "@/i18n/server";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { EasyModeToggle } from "@/components/EasyModeToggle";
import { WorkerAvatar } from "@/components/WorkerAvatar";

const NAV = [
  { href: "/worker", key: "wk.nav.home", icon: "🏠" },
  { href: "/worker/jobs", key: "wk.nav.jobs", icon: "🧰" },
  { href: "/worker/earnings", key: "wk.nav.earnings", icon: "💰" },
  { href: "/worker/passport", key: "wk.nav.passport", icon: "🎓" },
  { href: "/worker/profile", key: "wk.nav.profile", icon: "👤" },
];

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const worker = await currentWorker();
  if (!worker) redirect("/login?role=worker");
  const { t, locale, simple } = await getI18n();

  return (
    <div className="min-h-dvh pb-20">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/worker" className="flex min-h-11 items-center gap-2 font-extrabold text-brand">
            <span aria-hidden>🪢</span> {t("app.name")}
          </Link>
          <div className="flex items-center gap-2">
            <EasyModeToggle simple={simple} t={t} />
            <LanguageSwitcher locale={locale} />
            <WorkerAvatar id={worker.id} name={worker.name} trade={worker.categories[0]} photo={worker.photo} size={34} />
            <form action={logout}>
              <button className="min-h-11 text-sm font-semibold text-slate-600">{t("common.logout")}</button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>

      {/* Worker navigation leans on icons: short labels, big tap targets. */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white">
        <ul className="mx-auto flex max-w-3xl">
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
