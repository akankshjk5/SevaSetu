"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, nextId } from "./store";
import { currentHousehold } from "./session";
import { notifyProvider } from "./integrations/notify";
import { dictionaryFor, formatMoney, makeTranslator } from "@/i18n";
import { localeForUser } from "./messages";
import {
  DUKAAN_FEE,
  URGENT_VISIT_FEE,
  getShop,
  isUrgentTrade,
  runnerEtaMins,
  runnerFare,
  tradeForOrder,
  urgentEtaMins,
} from "./shops";
import type { CategoryId, RapidOrder, RapidOrderKind, WorkerProfile } from "./types";

/**
 * Places a hyperlocal order and finds someone to run it.
 *
 * The fee and ETA are computed here from the shop table and the distance, never
 * read from the form: the browser can put any number in a hidden field, so a
 * price that arrives from the client is not a price.
 */
export async function placeRapidOrder(formData: FormData) {
  const household = await currentHousehold();
  if (!household) redirect("/login?role=household");

  const kind = String(formData.get("kind") ?? "dukaan") as RapidOrderKind;
  const notes = String(formData.get("notes") ?? "").trim();
  const locality = String(formData.get("locality") || household.locality);

  let fee = 0;
  let etaMins = 0;
  let trade: CategoryId | undefined;
  let shopId: string | undefined;
  let shopName: string | undefined;
  let distanceKm: number | undefined;

  if (kind === "dukaan") {
    const shop = getShop(String(formData.get("shopId") ?? ""));
    // A shop the customer typed in themselves is allowed — that is the point of
    // "your own shop" — but it is recorded as unverified free text.
    shopName = shop?.name ?? String(formData.get("customShopName") ?? "").trim();
    if (!shopName) redirect("/?rapid=missing-shop#rapid");
    shopId = shop?.id;
    fee = DUKAAN_FEE;
    etaMins = shop?.etaMins ?? 20;
  } else if (kind === "minutes") {
    const asked = String(formData.get("trade") ?? "plumber");
    if (!isUrgentTrade(asked)) redirect("/?rapid=bad-trade#rapid");
    trade = asked;
    fee = URGENT_VISIT_FEE;
    etaMins = urgentEtaMins(asked);
  } else {
    distanceKm = Math.min(25, Math.max(1, Number(formData.get("distanceKm") ?? 3)));
    fee = runnerFare(distanceKm);
    etaMins = runnerEtaMins(distanceKm);
  }

  const order: RapidOrder = {
    id: nextId("rp"),
    kind,
    householdId: household.id,
    workerId: null,
    locality,
    addressLine: household.addressLine,
    shopId,
    shopName,
    trade,
    distanceKm,
    notes,
    fee,
    etaMins,
    status: "placed",
    createdAt: new Date().toISOString(),
  };

  const runner = findRunner(kind, locality, trade);
  if (runner) {
    order.workerId = runner.id;
    order.status = "assigned";
    const sent = await notifyProvider.send(buildRapidMessage(order, runner));
    if (sent.ok) order.notifiedAt = new Date().toISOString();
  }

  db().rapidOrders.push(order);

  revalidatePath("/household");
  revalidatePath("/admin");
  redirect(`/household/rapid/${order.id}`);
}

/** Nearest suitable verified worker: the right trade for a call-out, anyone free otherwise. */
function findRunner(kind: RapidOrderKind, locality: string, trade?: CategoryId): WorkerProfile | null {
  const pool = db().workers.filter((w) => w.verified && w.status === "active");
  const suitable = kind === "minutes" && trade ? pool.filter((w) => w.categories.includes(trade)) : pool;
  return suitable.find((w) => w.district === locality) ?? suitable[0] ?? null;
}

/** The same five-fact shape the household job card uses, in the runner's language. */
function buildRapidMessage(order: RapidOrder, worker: WorkerProfile) {
  const locale = localeForUser(worker.userId);
  const t = makeTranslator(dictionaryFor(locale));
  const household = db().households.find((h) => h.id === order.householdId);
  const money = (n: number) => formatMoney(n, locale);

  const what =
    order.kind === "dukaan"
      ? `${t("rapid.dukaan")} — ${order.shopName}`
      : order.kind === "minutes"
        ? `${t("rapid.minutes")} — ${t(`cat.${order.trade}`)}`
        : t("rapid.runner");

  const body = [
    `${t("app.name")} — ${t("rapid.newTask")}`,
    "",
    `👤 ${t("easy.appointedBy")}: ${household?.name ?? ""}`,
    `📦 ${t("easy.what")}: ${what}`,
    `🕐 ${t("easy.when")}: ${t("rapid.withinMins", { n: order.etaMins })}`,
    `📍 ${t("easy.where")}: ${order.addressLine}`,
    `💰 ${t("easy.howMuch")}: ${money(order.fee)}`,
    order.notes ? `📝 ${t("common.notes")}: ${order.notes}` : "",
    "",
    t("wa.openApp"),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    to: worker.phone,
    template: "rapid_task",
    vars: { what, eta: String(order.etaMins), fee: money(order.fee) },
    body,
  };
}

export async function advanceRapidOrder(formData: FormData) {
  const order = db().rapidOrders.find((o) => o.id === String(formData.get("orderId")));
  if (!order) return;
  const next = String(formData.get("status")) as RapidOrder["status"];
  order.status = next;
  revalidatePath(`/household/rapid/${order.id}`);
  revalidatePath("/admin");
}
