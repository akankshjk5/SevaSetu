import { currentHousehold } from "@/lib/session";
import { ZONES } from "@/lib/seed";
import { getI18n } from "@/i18n/server";
import type { CategoryId } from "@/lib/types";
import { PostNeedForm } from "./PostNeedForm";

export default async function PostNeedPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const sp = await searchParams;
  const household = await currentHousehold();
  if (!household) return null;
  const { t } = await getI18n();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">{t("hh.post.title")}</h1>
        <p className="text-sm text-slate-600">{t("hh.post.sub")}</p>
      </div>
      <PostNeedForm
        initialCategory={sp.category as CategoryId | undefined}
        zones={ZONES}
        defaultLocality={household.locality}
        defaultAddress={household.addressLine}
      />
    </div>
  );
}
