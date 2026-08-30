"use client";

import { useState } from "react";
import { submitAssessment } from "@/lib/actions-phases";
import { useI18n } from "@/i18n/client";
import type { CategoryId } from "@/lib/types";

export type QuizQuestion = { q: string; options: string[]; answer: number };

/**
 * Low-risk trades can prove skill with a short quiz. Electrician and plumber
 * work needs a practical check instead — that path is on the passport page.
 */
export function SkillQuiz({ trade, questions }: { trade: CategoryId; questions: QuizQuestion[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const answered = Object.keys(answers).length;
  const score = Math.round(
    (questions.filter((q, i) => answers[i] === q.answer).length / Math.max(1, questions.length)) * 100,
  );

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary w-full">
        {t("sp.takeTest")}
      </button>
    );
  }

  return (
    <form action={submitAssessment} className="mt-3 space-y-4">
      <input type="hidden" name="trade" value={trade} />
      <input type="hidden" name="score" value={score} />

      <div>
        <p className="font-bold">{t("sp.quiz.title", { trade: t(`cat.${trade}`) })}</p>
        <p className="text-xs text-slate-600">{t("sp.quiz.sub", { n: questions.length })}</p>
      </div>

      <ol className="space-y-4">
        {questions.map((q, qi) => (
          <li key={q.q}>
            <p className="text-sm font-semibold">
              {qi + 1}. {q.q}
            </p>
            <div className="mt-2 space-y-2">
              {q.options.map((opt, oi) => (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${
                    answers[qi] === oi ? "border-teal-500 bg-teal-50" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q${qi}`}
                    checked={answers[qi] === oi}
                    onChange={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                    className="h-5 w-5"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <button className="btn btn-primary w-full" disabled={answered < questions.length}>
        {t("sp.quiz.submit")}
      </button>
    </form>
  );
}
