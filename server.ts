import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = "gemini-4-hydrogen";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

type Difficulty = "Beginner" | "Exam Prep" | "Hard";

interface AttachmentPayload {
  name: string;
  mimeType: string;
  data: string;
}

interface QuizQuestion {
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface StudyPackResponse {
  topicTitle: string;
  summary: string;
  keyTakeaways: string[];
  commonPitfalls: string;
  questions: QuizQuestion[];
}

interface DrillPackResponse {
  focusSummary: string;
  questions: QuizQuestion[];
}

interface MissedItemPayload {
  topic: string;
  question: string;
  selectedOption: string;
  correctOption: string;
  explanation: string;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function sanitizeQuestions(rawQuestions: unknown, expectedCount: number): QuizQuestion[] {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    throw new Error("The AI model returned an invalid questions list.");
  }

  return rawQuestions.slice(0, expectedCount).map((item: unknown) => {
    const q = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const rawOptions = Array.isArray(q.options)
      ? q.options.map((opt) => String(opt ?? "").trim()).filter(Boolean)
      : [];

    const options = rawOptions.slice(0, 4);
    while (options.length < 4) {
      options.push(`Option ${options.length + 1}`);
    }

    const rawIndex = typeof q.correctIndex === "number" ? Math.trunc(q.correctIndex) : 0;
    const correctIndex = Math.max(0, Math.min(options.length - 1, rawIndex));

    return {
      topic: String(q.topic ?? "Core Concept").trim() || "Core Concept",
      question: String(q.question ?? "").trim() || "Which statement is most accurate?",
      options,
      correctIndex,
      explanation:
        String(q.explanation ?? "").trim() ||
        "Review the concept breakdown above for the underlying principle.",
    };
  });
}

function getDifficultyGuidance(difficulty: Difficulty): string {
  switch (difficulty) {
    case "Beginner":
      return "Target foundational understanding: use clear, accessible phrasing, test core definitions and primary relationships, and avoid obscure trick wording.";
    case "Hard":
      return "Target advanced mastery: test subtle edge cases, multi-step synthesis, counter-examples, and nuanced distinctions with plausible, rigorous distractors.";
    case "Exam Prep":
    default:
      return "Target university/professional exam readiness: balance conceptual recall with applied scenarios, cause-and-effect reasoning, and common exam-style distractors.";
  }
}

function parseAttachment(raw: unknown): AttachmentPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const data = typeof obj.data === "string" ? obj.data.trim() : "";
  const name = typeof obj.name === "string" ? obj.name.trim() : "attachment";
  const rawMime = typeof obj.mimeType === "string" ? obj.mimeType.trim().toLowerCase() : "";

  if (!data) return null;

  const estimatedBytes = Math.ceil((data.length * 3) / 4);
  if (estimatedBytes > MAX_FILE_BYTES) {
    throw new Error("Attached file exceeds the 10 MB limit. Please upload a smaller file.");
  }

  let mimeType = rawMime;
  if (!mimeType) {
    const lowerName = name.toLowerCase();
    if (lowerName.endsWith(".pdf")) mimeType = "application/pdf";
    else if (lowerName.endsWith(".md")) mimeType = "text/markdown";
    else if (lowerName.endsWith(".txt")) mimeType = "text/plain";
  }

  const isSupportedImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";
  const isTextDoc =
    mimeType === "text/plain" ||
    mimeType === "text/markdown" ||
    name.toLowerCase().endsWith(".txt") ||
    name.toLowerCase().endsWith(".md");

  if (!isSupportedImage && !isPdf && !isTextDoc) {
    throw new Error(
      "Unsupported file format. Please upload an image, PDF, TXT, or Markdown (.md) file."
    );
  }

  return { name, mimeType, data };
}

type ContentPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

function buildAttachmentParts(attachment: AttachmentPayload): ContentPart[] {
  const lowerName = attachment.name.toLowerCase();
  const isTextDoc =
    attachment.mimeType === "text/plain" ||
    attachment.mimeType === "text/markdown" ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md");

  if (isTextDoc) {
    const decoded = Buffer.from(attachment.data, "base64").toString("utf-8").slice(0, 30000);
    return [
      {
        text: `Attached Document (${attachment.name}):\n${decoded}`,
      },
    ];
  }

  return [
    {
      inlineData: {
        mimeType: attachment.mimeType,
        data: attachment.data,
      },
    },
  ];
}

const QUESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    topic: {
      type: Type.STRING,
      description: "Short 2 to 4 word sub-topic label for this specific question.",
    },
    question: {
      type: Type.STRING,
      description: "Clear, self-contained multiple-choice question prompt.",
    },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exactly 4 distinct, plausible answer choices without letter prefixes like A) or B).",
    },
    correctIndex: {
      type: Type.INTEGER,
      description: "Zero-based index (0, 1, 2, or 3) of the single correct answer in options.",
    },
    explanation: {
      type: Type.STRING,
      description:
        "1 to 2 crisp sentences explaining why the correct answer is right and clarifying the key distinction.",
    },
  },
  required: ["topic", "question", "options", "correctIndex", "explanation"],
};

const STUDY_PACK_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    topicTitle: {
      type: Type.STRING,
      description: "Concise 2 to 6 word title identifying the subject matter.",
    },
    summary: {
      type: Type.STRING,
      description: "Exactly 3 well-crafted, clear sentences summarizing the core material.",
    },
    keyTakeaways: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "4 or 5 high-signal bullet point takeaways.",
    },
    commonPitfalls: {
      type: Type.STRING,
      description:
        "2 to 3 focused sentences highlighting the biggest misconceptions, mistakes, or exam traps students fall into.",
    },
    questions: {
      type: Type.ARRAY,
      items: QUESTION_SCHEMA,
      description: "Exactly 10 multiple-choice questions covering the breadth of the material.",
    },
  },
  required: ["topicTitle", "summary", "keyTakeaways", "commonPitfalls", "questions"],
};

const DRILL_PACK_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    focusSummary: {
      type: Type.STRING,
      description:
        "1 to 2 concise sentences explaining what specific weak spots this targeted drill reinforces.",
    },
    questions: {
      type: Type.ARRAY,
      items: QUESTION_SCHEMA,
      description:
        "Exactly 5 brand-new multiple-choice questions targeting the concepts the student missed.",
    },
  },
  required: ["focusSummary", "questions"],
};

function parseDifficulty(value: unknown): Difficulty {
  if (value === "Beginner" || value === "Exam Prep" || value === "Hard") {
    return value;
  }
  return "Exam Prep";
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const errObj = (err && typeof err === "object" ? err : {}) as Record<string, unknown>;
      const status = typeof errObj.status === "number" ? errObj.status : 0;
      const msg = typeof errObj.message === "string" ? errObj.message : "";
      const isTransient = status === 503 || status === 500 || msg.includes("UNAVAILABLE");
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    }
  }
  throw lastError;
}

function formatGeminiError(error: unknown): { status: number; message: string } {
  const errObj = (error && typeof error === "object" ? error : {}) as Record<string, unknown>;
  let rawMessage =
    typeof errObj.message === "string" ? errObj.message : "Failed to generate study content.";
  let statusCode = typeof errObj.status === "number" ? errObj.status : 500;

  // Unwrap JSON-encoded error payloads returned by the SDK
  if (rawMessage.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(rawMessage) as {
        error?: { code?: number; message?: string; status?: string };
      };
      if (parsed.error?.message) {
        rawMessage = parsed.error.message;
      }
      if (typeof parsed.error?.code === "number") {
        statusCode = parsed.error.code;
      }
    } catch {
      // keep rawMessage
    }
  }

  if (rawMessage.includes("API_KEY_INVALID") || rawMessage.includes("GEMINI_API_KEY")) {
    return {
      status: 400,
      message:
        "Gemini API key is missing or invalid. Check your GEMINI_API_KEY in Settings > Secrets.",
    };
  }
  if (statusCode === 429 || rawMessage.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message: "Rate limit reached on the Gemini API. Please wait a moment and try again.",
    };
  }
  if (statusCode === 503 || rawMessage.includes("UNAVAILABLE")) {
    return {
      status: 503,
      message: "The AI service is momentarily busy. Please try again in a few seconds.",
    };
  }
  return {
    status: statusCode >= 400 && statusCode < 600 ? statusCode : 500,
    message: rawMessage,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "20mb" }));

  app.post("/api/generate", async (req, res) => {
    try {
      const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
      const difficulty = parseDifficulty(req.body?.difficulty);

      let attachment: AttachmentPayload | null = null;
      try {
        attachment = parseAttachment(req.body?.attachment);
      } catch (err) {
        res.status(400).json({
          error: err instanceof Error ? err.message : "Invalid file attachment.",
        });
        return;
      }

      if (!attachment && (!content || content.length < 3)) {
        res.status(400).json({
          error: "Please enter study notes, code, a topic, or attach a file first.",
        });
        return;
      }

      const trimmedContent = content.slice(0, 30000);
      const ai = getGeminiClient();

      const parts: ContentPart[] = [];
      if (attachment) {
        parts.push(...buildAttachmentParts(attachment));
      }

      const textPrompt = trimmedContent
        ? `Additional Study Notes / Context:\n${trimmedContent}\n\nDifficulty Level: ${difficulty}`
        : `Please thoroughly analyze the attached study file (${attachment?.name ?? "document"}) and generate the concept breakdown and quiz.\n\nDifficulty Level: ${difficulty}`;

      parts.push({ text: textPrompt });

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: { parts },
          config: {
            systemInstruction: [
              "You are QuizMe, an expert academic tutor and assessment designer.",
              "Analyze all provided study material—whether typed notes, code, images/diagrams, photos of whiteboards/textbooks, or PDF/text documents—and produce a structured study breakdown and a 10-question multiple-choice quiz.",
              getDifficultyGuidance(difficulty),
              "Strict formatting rules:",
              "- summary MUST be exactly 3 clear, well-structured sentences.",
              "- keyTakeaways MUST contain 4 or 5 distinct, crisp takeaways (1-2 sentences each, no leading bullet symbols).",
              "- commonPitfalls MUST be 2-3 focused sentences describing the most frequent misconceptions or subtle traps.",
              "- questions MUST contain exactly 10 multiple-choice questions testing different aspects of the material.",
              "- Each question MUST have exactly 4 plausible options (no A/B/C/D prefixes), a valid correctIndex (0-3), a short 2-4 word topic label, and a concise explanation.",
              "- Ensure correctIndex varies naturally across 0, 1, 2, and 3.",
            ].join("\n"),
            responseMimeType: "application/json",
            responseSchema: STUDY_PACK_SCHEMA,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        })
      );

      const rawText = (response.text ?? "").trim();
      if (!rawText) {
        throw new Error("Empty response received from Gemini.");
      }

      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      const rawPitfalls = parsed.commonPitfalls ?? parsed.coomonPitfalls;
      const keyTakeaways = Array.isArray(parsed.keyTakeaways)
        ? parsed.keyTakeaways.map((t) => String(t ?? "").trim()).filter(Boolean).slice(0, 5)
        : [];

      const payload: StudyPackResponse = {
        topicTitle: String(parsed.topicTitle ?? "Study Breakdown").trim() || "Study Breakdown",
        summary: String(parsed.summary ?? "").trim(),
        keyTakeaways:
          keyTakeaways.length > 0
            ? keyTakeaways
            : ["Review the primary concepts and definitions from your notes."],
        commonPitfalls:
          typeof rawPitfalls === "string" && rawPitfalls.trim()
            ? rawPitfalls.trim()
            : "Watch out for surface-level memorization without understanding how the underlying rules interact.",
        questions: sanitizeQuestions(parsed.questions, 10),
      };

      res.json(payload);
    } catch (error) {
      const { status, message } = formatGeminiError(error);
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/drill", async (req, res) => {
    try {
      const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
      const difficulty = parseDifficulty(req.body?.difficulty);
      const missedItems: MissedItemPayload[] = Array.isArray(req.body?.missedItems)
        ? req.body.missedItems
        : [];

      let attachment: AttachmentPayload | null = null;
      try {
        attachment = parseAttachment(req.body?.attachment);
      } catch {
        attachment = null;
      }

      if (missedItems.length === 0) {
        res.status(400).json({ error: "No missed topics were provided for a targeted drill." });
        return;
      }

      const missedSummary = missedItems
        .slice(0, 10)
        .map(
          (m, idx) =>
            `${idx + 1}. Topic: ${String(m.topic || "Concept")}\n   Question missed: ${String(m.question || "")}\n   Student answered: ${String(m.selectedOption || "")}\n   Correct answer: ${String(m.correctOption || "")}`
        )
        .join("\n\n");

      const parts: ContentPart[] = [];
      if (attachment) {
        parts.push(...buildAttachmentParts(attachment));
      }
      parts.push({
        text: `Original Study Material:\n${content ? content.slice(0, 20000) : "(See attached study material)"}\n\nDifficulty Level: ${difficulty}\n\nMissed Questions & Misconceptions:\n${missedSummary}`,
      });

      const ai = getGeminiClient();
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: { parts },
          config: {
            systemInstruction: [
              "You are QuizMe's adaptive remediation tutor.",
              "The student just completed a quiz and missed the specific concepts listed above.",
              "Generate a targeted follow-up drill with EXACTLY 5 brand-new multiple-choice questions that test those exact weak spots from fresh angles so the student genuinely masters the underlying reasoning.",
              getDifficultyGuidance(difficulty),
              "Strict formatting rules:",
              "- Do NOT copy or lightly reword the original missed questions; create new scenarios or diagnostic checks targeting the same misconceptions.",
              "- focusSummary MUST be 1-2 sentences summarizing the specific concepts being drilled.",
              "- questions MUST contain exactly 5 multiple-choice questions, each with 4 distinct options (no A/B/C/D prefixes), correctIndex (0-3), topic (2-4 words), and a crisp explanation.",
            ].join("\n"),
            responseMimeType: "application/json",
            responseSchema: DRILL_PACK_SCHEMA,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        })
      );

      const rawText = (response.text ?? "").trim();
      if (!rawText) {
        throw new Error("Empty response received from Gemini.");
      }

      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      const payload: DrillPackResponse = {
        focusSummary:
          String(parsed.focusSummary ?? "").trim() ||
          "Targeted follow-up questions focused on the concepts you missed.",
        questions: sanitizeQuestions(parsed.questions, 5),
      };

      res.json(payload);
    } catch (error) {
      const { status, message } = formatGeminiError(error);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("/{*splat}", (_req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Build artifacts not found.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`QuizMe server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start QuizMe server:", err);
  process.exit(1);
});
