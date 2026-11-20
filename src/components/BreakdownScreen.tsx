import { AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";
import type { Difficulty, StudyPack } from "../types";

interface BreakdownScreenProps {
  studyPack: StudyPack;
  difficulty: Difficulty;
  onBackToInput: () => void;
  onStartQuiz: () => void;
}

export function BreakdownScreen({
  studyPack,
  difficulty,
  onBackToInput,
  onStartQuiz,
}: BreakdownScreenProps) {
  return (
    <section aria-labelledby="breakdown-heading" className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Concept Breakdown</span>
            <span aria-hidden="true">·</span>
            <span>{difficulty}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{studyPack.questions.length} Questions Ready</span>
          </div>
          <h1
            id="breakdown-heading"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance"
          >
            {studyPack.topicTitle}
          </h1>
        </div>

        <button
          type="button"
          onClick={onBackToInput}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors self-start sm:self-auto whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-md px-2 py-1"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Edit study notes
        </button>
      </div>

      {/* Main Editorial Breakdown Card */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
        {/* 3-Sentence Summary */}
        <div className="p-6 sm:p-8 space-y-3">
          <h2 className="text-sm font-semibold text-indigo-600">Core Summary</h2>
          <p className="text-base sm:text-[17px] text-slate-800 leading-relaxed max-w-[70ch]">
            {studyPack.summary}
          </p>
        </div>

        {/* 4-5 Bulleted Key Takeaways */}
        <div className="p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Key Takeaways</h2>
          <ul className="space-y-3.5">
            {studyPack.keyTakeaways.map((takeaway, index) => (
              <li key={index} className="flex items-start gap-3.5">
                <span
                  aria-hidden="true"
                  className="mt-1 w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold tabular-nums flex items-center justify-center shrink-0"
                >
                  {index + 1}
                </span>
                <span className="text-[15px] text-slate-700 leading-relaxed">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Common Pitfalls Callout Box (all-around hairline border, zero left-border cliché) */}
      <div
        role="note"
        aria-label="Common Pitfalls"
        className="bg-amber-50/80 border border-amber-200 rounded-xl p-6 sm:p-7 space-y-2.5"
      >
        <div className="flex items-center gap-2 text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Common Pitfalls</h2>
        </div>
        <p className="text-[15px] text-amber-950/90 leading-relaxed max-w-[72ch]">
          {studyPack.commonPitfalls}
        </p>
      </div>

      {/* Prominent Quiz Me Now Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
        <p className="text-sm text-slate-600">
          Ready to test your understanding with {studyPack.questions.length} targeted questions?
        </p>
        <button
          type="button"
          onClick={onStartQuiz}
          className="px-7 py-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base inline-flex items-center justify-center gap-2.5 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          Quiz Me Now
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
