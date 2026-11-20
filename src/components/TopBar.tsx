import { BookOpenCheck } from "lucide-react";
import type { AppView } from "../types";

interface TopBarProps {
  currentView: AppView;
  hasStudyPack: boolean;
  onNavigate: (view: AppView) => void;
  onNewTopic: () => void;
  onLoadQuickSample: () => void;
}

export function TopBar({
  currentView,
  hasStudyPack,
  onNavigate,
  onNewTopic,
  onLoadQuickSample,
}: TopBarProps) {
  const navItems: Array<{ id: AppView; label: string; enabled: boolean }> = [
    { id: "input", label: "Study Notes", enabled: true },
    { id: "breakdown", label: "Concept Breakdown", enabled: hasStudyPack },
    { id: "quiz", label: "Interactive Quiz", enabled: hasStudyPack },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => onNavigate("input")}
          className="flex items-center gap-2.5 text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-md px-1 py-0.5 cursor-pointer"
        >
          <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <BookOpenCheck className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight">QuizMe</span>
        </button>

        <nav
          aria-label="Study workflow"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {navItems.map((item, idx) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={!item.enabled}
                onClick={() => item.enabled && onNavigate(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-sm ${
                  isActive
                    ? "text-indigo-600 font-semibold"
                    : item.enabled
                      ? "text-slate-600 hover:text-slate-900 cursor-pointer"
                      : "text-slate-300 cursor-not-allowed"
                }`}
              >
                <span className="tabular-nums mr-1.5 text-xs opacity-75">0{idx + 1}.</span>
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-[21px] h-0.5 bg-indigo-600"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          {currentView === "input" ? (
            <button
              type="button"
              onClick={onLoadQuickSample}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              Fill Sample Notes
            </button>
          ) : (
            <button
              type="button"
              onClick={onNewTopic}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              New Topic
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
