import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useState } from "react";
import { BreakdownScreen } from "./components/BreakdownScreen";
import { InputScreen } from "./components/InputScreen";
import { QuizScreen } from "./components/QuizScreen";
import { TopBar } from "./components/TopBar";
import { SAMPLE_TOPICS } from "./data/samples";
import type {
  AnsweredRecord,
  AppView,
  Difficulty,
  DrillPack,
  QuizQuestion,
  StudyAttachment,
  StudyPack,
} from "./types";

export default function App() {
  const [view, setView] = useState<AppView>("input");
  const [notes, setNotes] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Exam Prep");
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<StudyAttachment | null>(null);

  const [studyPack, setStudyPack] = useState<StudyPack | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizRunKey, setQuizRunKey] = useState(0);
  const [isDrillMode, setIsDrillMode] = useState(false);
  const [drillFocusSummary, setDrillFocusSummary] = useState<string | null>(null);
  const [isGeneratingDrill, setIsGeneratingDrill] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);

  function handleChangeNotes(value: string) {
    setNotes(value);
    if (activeSampleId) {
      const matched = SAMPLE_TOPICS.find((s) => s.id === activeSampleId);
      if (!matched || matched.notes !== value) {
        setActiveSampleId(null);
      }
    }
    if (generateError) {
      setGenerateError(null);
    }
  }

  function handleSelectSample(sampleId: string) {
    const sample = SAMPLE_TOPICS.find((s) => s.id === sampleId);
    if (!sample) return;
    setNotes(sample.notes);
    setActiveSampleId(sample.id);
    setGenerateError(null);
  }

  function handleLoadQuickSample() {
    const currentIndex = activeSampleId
      ? SAMPLE_TOPICS.findIndex((s) => s.id === activeSampleId)
      : -1;
    const nextSample = SAMPLE_TOPICS[(currentIndex + 1) % SAMPLE_TOPICS.length];
    handleSelectSample(nextSample.id);
  }

  function handleAttachFile(nextAttachment: StudyAttachment | null) {
    setAttachment(nextAttachment);
    if (generateError) {
      setGenerateError(null);
    }
  }

  async function handleGenerateBreakdown() {
    if (!notes.trim() && !attachment) {
      setGenerateError(
        "Please paste study notes, code, a topic, or attach an image/document before generating."
      );
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: notes,
          difficulty,
          attachment: attachment
            ? {
                name: attachment.name,
                mimeType: attachment.mimeType,
                data: attachment.data,
              }
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to generate study breakdown.");
      }

      const generated = data as StudyPack;
      setStudyPack(generated);
      setQuizQuestions(generated.questions);
      setIsDrillMode(false);
      setDrillFocusSummary(null);
      setDrillError(null);
      setQuizRunKey((k) => k + 1);
      setView("breakdown");
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Something went wrong while generating your quiz."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleStartQuiz() {
    if (!studyPack) return;
    setQuizQuestions(studyPack.questions);
    setIsDrillMode(false);
    setDrillFocusSummary(null);
    setDrillError(null);
    setQuizRunKey((k) => k + 1);
    setView("quiz");
  }

  function handleRetakeFullQuiz() {
    if (!studyPack) return;
    setQuizQuestions(studyPack.questions);
    setIsDrillMode(false);
    setDrillFocusSummary(null);
    setDrillError(null);
    setQuizRunKey((k) => k + 1);
  }

  async function handleDrillWeakSpots(missedRecords: AnsweredRecord[]) {
    if (missedRecords.length === 0) return;

    setIsGeneratingDrill(true);
    setDrillError(null);

    try {
      const res = await fetch("/api/drill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: notes,
          difficulty,
          attachment: attachment
            ? {
                name: attachment.name,
                mimeType: attachment.mimeType,
                data: attachment.data,
              }
            : null,
          missedItems: missedRecords.map((r) => ({
            topic: r.question.topic,
            question: r.question.question,
            selectedOption: r.question.options[r.selectedIndex] ?? "",
            correctOption: r.question.options[r.question.correctIndex] ?? "",
            explanation: r.question.explanation,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to generate targeted weak-spot drill.");
      }

      const drill = data as DrillPack;
      setQuizQuestions(drill.questions);
      setIsDrillMode(true);
      setDrillFocusSummary(drill.focusSummary);
      setQuizRunKey((k) => k + 1);
    } catch (err) {
      setDrillError(
        err instanceof Error ? err.message : "Failed to generate targeted drill questions."
      );
    } finally {
      setIsGeneratingDrill(false);
    }
  }

  function handleNewTopic() {
    setView("input");
    setGenerateError(null);
    setDrillError(null);
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <TopBar
          currentView={view}
          hasStudyPack={studyPack !== null}
          onNavigate={(targetView) => {
            if (targetView === "quiz" && studyPack && quizQuestions.length === 0) {
              setQuizQuestions(studyPack.questions);
            }
            setView(targetView);
          }}
          onNewTopic={handleNewTopic}
          onLoadQuickSample={handleLoadQuickSample}
        />

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <AnimatePresence mode="wait">
            {view === "input" && (
              <motion.div
                key="view-input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <InputScreen
                  notes={notes}
                  difficulty={difficulty}
                  activeSampleId={activeSampleId}
                  attachment={attachment}
                  isLoading={isGenerating}
                  error={generateError}
                  onChangeNotes={handleChangeNotes}
                  onSelectDifficulty={setDifficulty}
                  onSelectSample={handleSelectSample}
                  onAttachFile={handleAttachFile}
                  onGenerate={handleGenerateBreakdown}
                />
              </motion.div>
            )}

            {view === "breakdown" && studyPack && (
              <motion.div
                key="view-breakdown"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <BreakdownScreen
                  studyPack={studyPack}
                  difficulty={difficulty}
                  onBackToInput={() => setView("input")}
                  onStartQuiz={handleStartQuiz}
                />
              </motion.div>
            )}

            {view === "quiz" && studyPack && (
              <motion.div
                key={`view-quiz-${quizRunKey}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <QuizScreen
                  topicTitle={studyPack.topicTitle}
                  difficulty={difficulty}
                  questions={quizQuestions}
                  isDrillMode={isDrillMode}
                  drillFocusSummary={drillFocusSummary}
                  isGeneratingDrill={isGeneratingDrill}
                  drillError={drillError}
                  onBackToBreakdown={() => setView("breakdown")}
                  onRetakeFullQuiz={handleRetakeFullQuiz}
                  onDrillWeakSpots={handleDrillWeakSpots}
                  onNewTopic={handleNewTopic}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </MotionConfig>
  );
}
