import { learningStages, type LearningStage } from "@/lib/learning-stages";

export type ConversationMessage = { role: "learner" | "mentor"; content: string };

export type MentorFeedback = {
  mentorReply: string;
  strengths: string[];
  improvements: string[];
  encouragement: string;
  confidenceScore: number;
  hintLevel: number;
};

export type MentorResponse = MentorFeedback & {
  currentStage: LearningStage;
  nextStage: LearningStage;
  stageCompleted: boolean;
  sessionSummary?: SessionSummary;
};

export type SessionAnalytics = {
  completedStages: LearningStage[];
  totalInteractions: number;
  hintsUsed: number;
  startedAt: number;
  latestConfidenceScore: number;
  stageAttempts: Partial<Record<LearningStage, number>>;
};

export type SessionSummary = {
  overallConfidence: number;
  stagesCompleted: number;
  biggestStrength: string;
  biggestWeakness: string;
  nextTopic: string;
  learningSummary: string;
};

export type StoredSession = {
  history: ConversationMessage[];
  currentStage: LearningStage;
  analytics: SessionAnalytics;
  latestFeedback?: MentorFeedback;
  summary?: SessionSummary;
};

export function createSessionAnalytics(): SessionAnalytics {
  return { completedStages: [], totalInteractions: 0, hintsUsed: 0, startedAt: Date.now(), latestConfidenceScore: 0, stageAttempts: {} };
}

export function isSessionAnalytics(value: unknown): value is SessionAnalytics {
  if (typeof value !== "object" || value === null) return false;
  const analytics = value as Partial<SessionAnalytics>;
  return Array.isArray(analytics.completedStages) && analytics.completedStages.every((stage) => learningStages.includes(stage)) && typeof analytics.totalInteractions === "number" && typeof analytics.hintsUsed === "number" && typeof analytics.startedAt === "number" && typeof analytics.latestConfidenceScore === "number" && typeof analytics.stageAttempts === "object" && analytics.stageAttempts !== null;
}
