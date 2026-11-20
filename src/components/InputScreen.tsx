import {
  AlertCircle,
  ArrowRight,
  Camera,
  FileText,
  ImagePlus,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { SAMPLE_TOPICS } from "../data/samples";
import type { Difficulty, StudyAttachment } from "../types";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

interface InputScreenProps {
  notes: string;
  difficulty: Difficulty;
  activeSampleId: string | null;
  attachment: StudyAttachment | null;
  isLoading: boolean;
  error: string | null;
  onChangeNotes: (value: string) => void;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onSelectSample: (sampleId: string) => void;
  onAttachFile: (attachment: StudyAttachment | null) => void;
  onGenerate: () => void;
}

const DIFFICULTIES: Array<{
  value: Difficulty;
  title: string;
  description: string;
}> = [
  {
    value: "Beginner",
    title: "Beginner",
    description: "Core definitions, plain language, and foundational concepts.",
  },
  {
    value: "Exam Prep",
    title: "Exam Prep",
    description: "Applied scenarios, mechanism links, and exam-level traps.",
  },
  {
    value: "Hard",
    title: "Hard",
    description: "Subtle edge cases, synthesis, and rigorous distractors.",
  },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeLabel(attachment: StudyAttachment): string {
  const lower = attachment.name.toLowerCase();
  if (attachment.mimeType.startsWith("image/")) return "Image";
  if (attachment.mimeType === "application/pdf" || lower.endsWith(".pdf")) return "PDF Document";
  if (lower.endsWith(".md") || attachment.mimeType === "text/markdown") return "Markdown";
  return "Text File";
}

function resolveMimeType(file: File): string {
  if (file.type) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".md")) return "text/markdown";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

export function InputScreen({
  notes,
  difficulty,
  activeSampleId,
  attachment,
  isLoading,
  error,
  onChangeNotes,
  onSelectDifficulty,
  onSelectSample,
  onAttachFile,
  onGenerate,
}: InputScreenProps) {
  const [fileError, setFileError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const charCount = notes.trim().length;
  const canGenerate = (charCount >= 3 || attachment !== null) && !isLoading;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setFileError(null);

    if (file.size > MAX_FILE_BYTES) {
      setFileError(
        `"${file.name}" is ${formatFileSize(file.size)}, which exceeds the 10 MB maximum. Please choose a smaller file.`
      );
      return;
    }

    const mimeType = resolveMimeType(file);
    const lower = file.name.toLowerCase();
    const isImage = mimeType.startsWith("image/");
    const isDocument =
      mimeType === "application/pdf" ||
      mimeType === "text/plain" ||
      mimeType === "text/markdown" ||
      lower.endsWith(".pdf") ||
      lower.endsWith(".txt") ||
      lower.endsWith(".md");

    if (!isImage && !isDocument) {
      setFileError(
        `"${file.name}" is not a supported format. Please attach an image, PDF, TXT, or Markdown (.md) file.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const commaIndex = result.indexOf(",");
      const base64Data = commaIndex >= 0 ? result.slice(commaIndex + 1) : "";

      if (!base64Data) {
        setFileError(`Could not read "${file.name}". Please try another file.`);
        return;
      }

      onAttachFile({
        name: file.name,
        mimeType,
        size: file.size,
        data: base64Data,
        previewUrl: isImage ? result : undefined,
      });
    };
    reader.onerror = () => {
      setFileError(`Failed to read "${file.name}". Please try again.`);
    };
    reader.readAsDataURL(file);
  }

  return (
    <section aria-labelledby="input-heading" className="space-y-8">
      <div className="max-w-2xl space-y-2">
        <h1
          id="input-heading"
          className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance"
        >
          Turn study notes into sharp recall.
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Paste notes, snap a photo of a whiteboard or textbook, or upload a PDF to get a
          structured breakdown, common pitfalls, and a 10-question interactive quiz.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Notes Editor, Upload Actions & Sample Topics */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">
                Quick-fill sample topics
              </span>
              {notes.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChangeNotes("")}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Clear text
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Sample study topics">
              {SAMPLE_TOPICS.map((sample) => {
                const isSelected = activeSampleId === sample.id;
                return (
                  <button
                    key={sample.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => onSelectSample(sample.id)}
                    className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-full border transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-50 ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-indigo-50/70 text-indigo-800 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300"
                    }`}
                  >
                    {sample.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="study-notes-input" className="sr-only">
              Study notes, code, or topic
            </label>
            <textarea
              id="study-notes-input"
              value={notes}
              onChange={(e) => onChangeNotes(e.target.value)}
              disabled={isLoading}
              rows={11}
              placeholder="Paste your lecture notes, textbook excerpt, code snippet, or add optional instructions for an attached photo or document..."
              className="w-full min-h-[250px] p-4 rounded-lg border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 text-sm sm:text-[15px] leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors resize-y disabled:opacity-60"
            />

            {/* Three File / Camera Action Buttons right below text area */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-hidden="true"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-hidden="true"
                />
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-hidden="true"
                />

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => imageInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-indigo-50/70 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  <ImagePlus className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  Upload Image
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-indigo-50/70 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  <Camera className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  Take Photo
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => documentInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-indigo-50/70 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  <FileText className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  Upload Document
                </button>
              </div>

              <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
                {charCount.toLocaleString()} {charCount === 1 ? "char" : "chars"} · Max 10 MB file
              </span>
            </div>

            {/* File Size / Format Error Message */}
            {fileError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
                  <span>{fileError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFileError(null)}
                  aria-label="Dismiss file error"
                  className="text-red-500 hover:text-red-800 p-0.5 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Attached File Preview Card */}
            {attachment && (
              <div className="p-3.5 rounded-lg bg-indigo-50/50 border border-indigo-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {attachment.previewUrl ? (
                    <img
                      src={attachment.previewUrl}
                      alt={`Preview of ${attachment.name}`}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-md object-cover border border-slate-200 bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" aria-hidden="true" />
                    </div>
                  )}

                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-slate-600 tabular-nums">
                      {getFileTypeLabel(attachment)} · {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setFileError(null);
                    onAttachFile(null);
                  }}
                  aria-label={`Remove ${attachment.name}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-md border border-transparent hover:border-red-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Difficulty & Action Panel */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Difficulty Level</h2>
            <div className="space-y-2.5" role="radiogroup" aria-label="Difficulty level">
              {DIFFICULTIES.map((item) => {
                const isSelected = difficulty === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isLoading}
                    onClick={() => onSelectDifficulty(item.value)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-50 ${
                      isSelected
                        ? "bg-indigo-50/80 border-indigo-600 ring-1 ring-indigo-600"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          isSelected ? "text-indigo-950" : "text-slate-900"
                        }`}
                      >
                        {item.title}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="text-xs text-slate-500 leading-relaxed">
              Includes 3-sentence summary · 4–5 key takeaways · Common pitfalls · 10-question quiz
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate}
              className="w-full py-3 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors duration-150 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Generating Breakdown &amp; Quiz...
                </>
              ) : (
                <>
                  Generate Breakdown &amp; Quiz
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
