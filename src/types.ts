export type Difficulty = "Beginner" | "Exam Prep" | "Hard";

export type AppView = "input" | "breakdown" | "quiz";

export interface StudyAttachment {
  name: string;
  mimeType: string;
  size: number;
  data: string; // raw base64 (no data URL prefix)
  previewUrl?: string; // object URL or data URL for image thumbnails
}

export interface QuizQuestion {
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudyPack {
  topicTitle: string;
  summary: string;
  keyTakeaways: string[];
  commonPitfalls: string;
  questions: QuizQuestion[];
}

export interface DrillPack {
  focusSummary: string;
  questions: QuizQuestion[];
}

export interface AnsweredRecord {
  questionIndex: number;
  question: QuizQuestion;
  selectedIndex: number;
  isCorrect: boolean;
}
