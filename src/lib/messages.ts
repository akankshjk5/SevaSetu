import { dictionaryFor, formatDate, formatMoney, makeTranslator } from "@/i18n";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { CATEGORY_MAP } from "./categories";
import { db } from "./store";
import type { Booking, HouseholdProfile, WorkerProfile } from "./types";

/**
 * The job message a worker receives on WhatsApp.
 *
 * Built from the same five facts as `JobFactCard`, in the same order — who
 * called you, what work, when, where, how much — so the message and the screen
 * can never drift apart. Composed in the *worker's* saved language, not the
 * household's, because the worker is the one reading it.
 */

export type JobMessage = {
  /** Plain text, ready for a WhatsApp body or an SMS. */
  body: string;
  /** Template name a real WhatsApp Business API would key off. */
  template: string;
  vars: Record<string, string>;
  locale: Locale;
};

export function localeForUser(userId: string | undefined): Locale {
  if (!userId) return DEFAULT_LOCALE;
  const user = db().users.find((u) => u.id === userId);
  return isLocale(user?.language) ? user.language : DEFAULT_LOCALE;
}

export function buildJobMessage({
  booking,
  worker,
  household,
}: {
  booking: Booking;
  worker: WorkerProfile;
  household: HouseholdProfile;
}): JobMessage {
  const locale = localeForUser(worker.userId);
  const t = makeTranslator(dictionaryFor(locale));
  const money = (n: number) => formatMoney(n, locale);
  const category = CATEGORY_MAP[booking.category];

  const when = `${formatDate(booking.date, locale)}, ${booking.time}`;
  const lines = [
    `${t("app.name")} — ${t("wa.newJob")}`,
    "",
    `👤 ${t("easy.appointedBy")}: ${household.name}`,
    `${category.icon} ${t("easy.what")}: ${t(`cat.${booking.category}`)}`,
    `🕐 ${t("easy.when")}: ${when}`,
    `📍 ${t("easy.where")}: ${booking.addressLine}`,
    `💰 ${t("easy.howMuch")}: ${money(booking.price)}`,
  ];

  if (booking.notes) lines.push(`📝 ${t("common.notes")}: ${booking.notes}`);
  lines.push("", t("wa.openApp"));

  return {
    body: lines.join("\n"),
    template: "new_job_request",
    vars: {
      household: household.name,
      category: t(`cat.${booking.category}`),
      when,
      where: booking.addressLine,
      price: money(booking.price),
    },
    locale,
  };
}

/**
 * A wa.me deep link, so the prototype can hand the message to real WhatsApp
 * without a Business API account: the household taps it and WhatsApp opens
 * with the text already filled in, addressed to the worker.
 */
export function whatsappLink(phone: string, body: string) {
  const digits = phone.replace(/\D/g, "");
  // Seeded numbers are 10-digit Indian mobiles; prefix the country code.
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(body)}`;
}
