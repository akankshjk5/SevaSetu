import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/store";
import { categoryName } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";

/**
 * Aggregated CSV export for the government view. It reads only from the
 * pre-aggregated `AggregatedStat` table — personal records are never touched
 * here, so no export can re-identify a worker or a household.
 */
export async function GET(request: Request) {
  const user = await currentUser();
  if (!user || (user.role !== "government" && user.role !== "admin")) {
    return new NextResponse("Not authorised", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "";
  const district = searchParams.get("district") ?? "all";
  const trade = (searchParams.get("trade") ?? "all") as CategoryId | "all";

  const rows = db().stats.filter(
    (s) =>
      (!period || s.period === period) &&
      (district === "all" || s.district === district) &&
      (trade === "all" || s.trade === trade),
  );

  const header = [
    "period",
    "zone",
    "trade",
    "requests",
    "workers_available",
    "verified_workers",
    "requests_filled",
    "fill_rate_percent",
    "unmet_demand",
    "average_pay_inr",
    "training_need_score",
  ];

  const lines = rows.map((s) =>
    [
      s.period,
      s.district,
      categoryName(s.trade),
      s.demand,
      s.supply,
      s.verifiedWorkers,
      s.filled,
      s.demand ? Math.round((s.filled / s.demand) * 100) : 0,
      Math.max(0, s.demand - s.supply),
      s.avgWage,
      s.trainingDemandSignal,
    ].join(","),
  );

  const csv = [header.join(","), ...lines].join("\n");
  const name = `sevasetu-jaipur-${district === "all" ? "all-zones" : district.toLowerCase().replace(/\s+/g, "-")}-${period || "all-months"}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
