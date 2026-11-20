import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Target,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { AnsweredRecord, Difficulty, QuizQuestion } from "../types";

interface QuizScreenProps {
  topicTitle: string;
  difficulty: Difficulty;
  questions: QuizQuestion[];
  isDrillMode: boolean;
  drillFocusSummary: string | null;
  isGeneratingDrill: boolean;
  drillError: string | null;
  onBackToBreakdown: () => void;
  onRetakeFullQuiz: () => void;
  onDrillWeakSpots: (missedRecords: AnsweredRecord[]) => void;
  onNewTopic: () => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

export function QuizScreen({
  topicTitle,
  difficulty,
  questions,
  isDrillMode,
  drillFocusSummary,
  isGeneratingDrill,
  drillError,
  onBackToBreakdown,
  onRetakeFullQuiz,
  onDrillWeakSpots,
  onNewTopic,
}: QuizScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [records, setRecords] = useState<AnsweredRecord[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const hasAnsweredCurrent = selectedOption !== null;

  const correctCountSoFar = records.filter((r) => r.isCorrect).length;
  const progressRatio = totalQuestions > 0
    ? (isCompleted ? totalQuestions : currentIndex + (hasAnsweredCurrent ? 1 : 0)) / totalQuestions
    : 0;

  function handleSelectOption(optionIdx: number) {
    if (hasAnsweredCurrent || !currentQuestion) return;

    const isCorrect = optionIdx === currentQuestion.correctIndex;
    setSelectedOption(optionIdx);
    setRecords((prev) => [
      ...prev,
      {
        questionIndex: currentIndex,
        question: currentQuestion,
        selectedIndex: optionIdx,
        isCorrect,
      },
    ]);
  }

  function handleNext() {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsCompleted(true);
    }
  }

  if (isCompleted) {
    const score = records.filter((r) => r.isCorrect).length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const missedRecords = records.filter((r) => !r.isCorrect);
    const uniqueMissedTopics = Array.from(
      new Set(missedRecords.map((r) => r.question.topic).filter(Boolean))
    );

    const outcomeHeadline =
      percentage === 100
        ? "Perfect mastery on this set."
        : percentage >= 80
          ? "Strong grasp of the core material."
          : percentage >= 60
            ? "Solid foundation with a few gaps to close."
            : "Worth reviewing the missed concepts below.";

    return (
      <section aria-labelledby="score-heading" className="max-w-3xl mx-auto space-y-8">
        {/* Final Score Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span>{isDrillMode ? "Weak-Spot Drill Complete" : "Quiz Complete"}</span>
                <span aria-hidden="true">·</span>
                <span>{difficulty}</span>
                <span aria-hidden="true">·</span>
                <span>{topicTitle}</span>
              </div>
              <h1
                id="score-heading"
                className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance"
              >
                {outcomeHeadline}
              </h1>
            </div>

            <div className="flex items-baseline gap-2 sm:text-right shrink-0">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-indigo-600 tabular-nums">
                {score}/{totalQuestions}
              </span>
              <span className="text-base font-semibold text-slate-500 tabular-nums">
                ({percentage}%)
              </span>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span className="tabular-nums">{score} Correct</span>
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                {missedRecords.length === 0 ? (
                  <>
                    <Award className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                    <span>Zero missed questions</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-600" aria-hidden="true" />
                    <span className="tabular-nums">{missedRecords.length} Missed</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onBackToBreakdown}
                disabled={isGeneratingDrill}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                Review Breakdown
              </button>
              <button
                type="button"
                onClick={onRetakeFullQuiz}
                disabled={isGeneratingDrill}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Retake Full Quiz
              </button>
            </div>
          </div>
        </div>

        {/* Missed Topics & Drill My Weak Spots */}
        {missedRecords.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
              <div className="space-y-1.5">
                <h2 className="text-base font-semibold text-slate-900">
                  Missed Topics ({uniqueMissedTopics.length})
                </h2>
                <p className="text-sm text-slate-600">
                  Focus areas: {uniqueMissedTopics.join(" · ")}
                </p>
              </div>

              <button
                type="button"
                disabled={isGeneratingDrill}
                onClick={() => onDrillWeakSpots(missedRecords)}
                className="px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              >
                {isGeneratingDrill ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Building 5-Question Drill...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" aria-hidden="true" />
                    Drill My Weak Spots
                  </>
                )}
              </button>
            </div>

            {drillError && (
              <div
                role="alert"
                className="mx-6 mt-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
                <span>{drillError}</span>
              </div>
            )}

            <ul className="divide-y divide-slate-200">
              {missedRecords.map((record) => (
                <li key={record.questionIndex} className="p-6 sm:p-8 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
                    <span>{record.question.topic}</span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="text-slate-500 font-medium tabular-nums">
                      Question {record.questionIndex + 1}
                    </span>
                  </div>

                  <p className="text-[15px] font-semibold text-slate-900 leading-snug">
                    {record.question.question}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm pt-1">
                    <div className="p-3 rounded-lg bg-red-50/80 border border-red-200 text-red-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-red-700">
                        <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Your answer</span>
                      </div>
                      <p>{record.question.options[record.selectedIndex]}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Correct answer</span>
                      </div>
                      <p>{record.question.options[record.question.correctIndex]}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {record.question.explanation}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-900 font-semibold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>Clean sweep — no missed topics</span>
              </div>
              <p className="text-sm text-emerald-900/80">
                You answered every question accurately. Ready to tackle a harder difficulty or study
                a new topic?
              </p>
            </div>
            <button
              type="button"
              onClick={onNewTopic}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Study New Material
            </button>
          </div>
        )}
      </section>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <section aria-labelledby="quiz-question-heading" className="max-w-3xl mx-auto space-y-6">
      {/* Top Quiz Metadata & Progress Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={onBackToBreakdown}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer mr-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Breakdown
            </button>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {isDrillMode ? "Weak-Spot Drill · " : ""}
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span>{currentQuestion.topic}</span>
          </div>

          <div className="text-xs sm:text-sm font-medium text-slate-600 tabular-nums">
            Score: <span className="text-slate-900 font-semibold">{correctCountSoFar}</span>/
            {records.length}
          </div>
        </div>

        {/* Compositor-only transform progress bar */}
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalQuestions}
          aria-valuenow={isCompleted ? totalQuestions : currentIndex + (hasAnsweredCurrent ? 1 : 0)}
          aria-label="Quiz progress"
          className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"
        >
          <div
            className="h-full w-full bg-indigo-600 origin-left transition-transform duration-300 ease-out"
            style={{ transform: `scaleX(${progressRatio})` }}
          />
        </div>

        {isDrillMode && drillFocusSummary && currentIndex === 0 && (
          <div className="p-3.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-xs sm:text-sm text-indigo-950 flex items-start gap-2.5">
            <Target className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{drillFocusSummary}</span>
          </div>
        )}
      </div>

      {/* Active Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${isDrillMode ? "drill" : "quiz"}-${currentIndex}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
        >
          <h1
            id="quiz-question-heading"
            className="text-lg sm:text-xl font-semibold text-slate-900 leading-snug text-balance"
          >
            {currentQuestion.question}
          </h1>

          <div className="space-y-3" role="group" aria-label="Answer options">
            {currentQuestion.options.map((option, idx) => {
              const isCorrectOption = idx === currentQuestion.correctIndex;
              const isSelectedOption = idx === selectedOption;

              let buttonStyle =
                "bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/40";
              let keycapStyle =
                "bg-slate-100 text-slate-700 border-slate-200";
              let statusBadge: { text: string; icon: "check" | "x" } | null = null;

              if (hasAnsweredCurrent) {
                if (isCorrectOption) {
                  buttonStyle =
                    "bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500";
                  keycapStyle =
                    "bg-emerald-600 text-white border-emerald-600";
                  statusBadge = { text: "Correct", icon: "check" };
                } else if (isSelectedOption) {
                  buttonStyle =
                    "bg-red-50 border-red-400 text-red-950 ring-1 ring-red-400";
                  keycapStyle =
                    "bg-red-600 text-white border-red-600";
                  statusBadge = { text: "Incorrect", icon: "x" };
                } else {
                  buttonStyle =
                    "bg-slate-50/50 border-slate-200 text-slate-400 opacity-75";
                  keycapStyle =
                    "bg-slate-100 text-slate-400 border-slate-200";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={hasAnsweredCurrent}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full min-h-[54px] text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${buttonStyle} ${
                    hasAnsweredCurrent ? "cursor-default" : "cursor-pointer"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span
                      aria-hidden="true"
                      className={`w-7 h-7 rounded-md border text-xs font-semibold flex items-center justify-center shrink-0 transition-colors ${keycapStyle}`}
                    >
                      {OPTION_LETTERS[idx] ?? idx + 1}
                    </span>
                    <span className="text-[15px] font-medium leading-snug pt-0.5">
                      {option}
                    </span>
                  </div>

                  {statusBadge && (
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                        statusBadge.icon === "check" ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {statusBadge.icon === "check" ? (
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <XCircle className="w-4 h-4" aria-hidden="true" />
                      )}
                      {statusBadge.text}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Immediate Explanation Panel */}
          <AnimatePresence>
            {hasAnsweredCurrent && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="pt-2 space-y-5"
              >
                <div
                  role="status"
                  className={`p-4 rounded-lg border text-sm leading-relaxed ${
                    selectedOption === currentQuestion.correctIndex
                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <p className="font-semibold mb-1 text-slate-900">
                    {selectedOption === currentQuestion.correctIndex
                      ? "Why this is right"
                      : "Explanation"}
                  </p>
                  <p>{currentQuestion.explanation}</p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                  >
                    {currentIndex + 1 < totalQuestions ? "Next Question" : "View Final Score"}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
