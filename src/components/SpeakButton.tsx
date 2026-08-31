"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/client";
import { LOCALE_META } from "@/i18n/config";

/**
 * Reads a screen's key facts aloud in the current language.
 *
 * For a worker who cannot read comfortably, hearing "Ankit Agarwal, Malviya
 * Nagar, cleaning, tomorrow 7 o'clock, 4200 rupees" is the difference between
 * understanding a job and guessing at it. Uses the browser's built-in speech
 * synthesis — no network call, no account, works on a mid-range Android.
 *
 * Hidden entirely when the device has no speech support, rather than showing a
 * button that does nothing.
 */
export function SpeakButton({ text, label }: { text: string; label?: string }) {
  const { t, locale } = useI18n();
  const [speaking, setSpeaking] = useState(false);

  // Reading a browser capability, not React state: subscribe-free external
  // store keeps the server render (false) and the client render consistent.
  const supported = useSyncExternalStore(
    () => () => {},
    () => "speechSynthesis" in window,
    () => false,
  );

  // Stop any speech if the screen goes away mid-sentence.
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  if (!supported) return null;

  const speak = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LOCALE_META[locale].intl;
    // A little slower than default: these are numbers, times and addresses.
    utter.rate = 0.92;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(utter);
    setSpeaking(true);
  };

  return (
    <button
      type="button"
      onClick={speak}
      aria-label={label ?? t("easy.listen")}
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-teal-50 px-4 text-sm font-bold text-teal-900 ring-1 ring-teal-200"
    >
      <span aria-hidden className="text-base">
        {speaking ? "⏹" : "🔊"}
      </span>
      {speaking ? t("easy.stop") : (label ?? t("easy.listen"))}
    </button>
  );
}
