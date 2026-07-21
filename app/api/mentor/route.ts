import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getNextStage, isLearningStage, type LearningStage } from "@/lib/learning-stages";
import type { ConversationMessage, SessionSummary } from "@/lib/learning-session";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type MentorEvaluation = {
  mentorReply: string;
  strengths: string[];
  improvements: string[];
  encouragement: string;
  currentStage: LearningStage;
  nextStage: LearningStage;
  stageCompleted: boolean;
  confidenceScore: number;
  hintLevel: number;
  sessionSummary?: SessionSummary;
};

const problemStatement = "Given an array of integers and a target, find the indices of two numbers that add up to the target. Example: nums = [2, 7, 11, 15], target = 9, output = [0, 1].";
const stageCriteria: Record<LearningStage, string> = {
  Understand: "State that the task is to return indices of two distinct numbers whose values sum to the target.",
  Assumptions: "Identify relevant constraints such as distinct indices, duplicates, negative values, one/no valid pair, or expected output.",
  Approach: "Explain a viable strategy and why it finds a valid pair, without implementation details.",
  "Edge Cases": "Consider meaningful boundary cases such as duplicates, negatives, no solution, or very short arrays.",
  Complexity: "Correctly explain the time and space complexity of the proposed approach.",
  Code: "Provide correct learner-authored code or pseudocode that implements their approach and handles stated assumptions.",
};

const mentorInstructions = `You are CodeCompile's Socratic programming mentor.
Help learners think; do not provide a complete solution or complete code. In the Code stage, review learner-authored code and ask a targeted question or suggest a small correction. Ask 1-2 concise guiding questions and encourage reasoning.`;

function isConversationHistory(value: unknown): value is ConversationMessage[] {
  return Array.isArray(value) && value.every((message) => typeof message === "object" && message !== null && (message.role === "learner" || message.role === "mentor") && typeof message.content === "string");
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isSessionSummary(value: unknown): value is SessionSummary {
  if (typeof value !== "object" || value === null) return false;
  const summary = value as Partial<SessionSummary>;
  return typeof summary.overallConfidence === "number" && typeof summary.stagesCompleted === "number" && typeof summary.biggestStrength === "string" && typeof summary.biggestWeakness === "string" && typeof summary.nextTopic === "string" && typeof summary.learningSummary === "string";
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY is missing." }, { status: 500 });

  try {
    const body = await request.json();
    if (!isLearningStage(body.stage) || typeof body.learnerResponse !== "string" || !isConversationHistory(body.history) || !Number.isInteger(body.failedAttempts) || body.failedAttempts < 0) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const currentStage: LearningStage = body.stage;
    const hintLevel = Math.min(body.failedAttempts, 3);
    const isFinalEvaluation = currentStage === "Code";

    const history = body.history.map((message: ConversationMessage) => `${message.role === "learner" ? "Learner" : "Mentor"}: ${message.content}`).join("\n");
    const response = await client.responses.create({
      model: "gpt-5.6",
      reasoning: { effort: "low" },
      instructions: mentorInstructions,
      text: { format: { type: "json_schema", name: "mentor_stage_evaluation", strict: true, schema: {
        type: "object", additionalProperties: false, required: ["mentorReply", "strengths", "improvements", "encouragement", "stageCompleted", "confidenceScore", "sessionSummary"],
        properties: {
          mentorReply: { type: "string" }, strengths: { type: "array", items: { type: "string" }, maxItems: 2 }, improvements: { type: "array", items: { type: "string" }, maxItems: 2 }, encouragement: { type: "string" }, stageCompleted: { type: "boolean" }, confidenceScore: { type: "integer", minimum: 0, maximum: 100 },
          sessionSummary: { anyOf: [{ type: "null" }, { type: "object", additionalProperties: false, required: ["overallConfidence", "stagesCompleted", "biggestStrength", "biggestWeakness", "nextTopic", "learningSummary"], properties: { overallConfidence: { type: "integer", minimum: 0, maximum: 100 }, stagesCompleted: { type: "integer", minimum: 0, maximum: 6 }, biggestStrength: { type: "string" }, biggestWeakness: { type: "string" }, nextTopic: { type: "string" }, learningSummary: { type: "string" } } }] },
        },
      } } },
      input: `Problem:\n${problemStatement}\n\nCurrent Stage:\n${currentStage}\n\nEvidence required to complete this stage:\n${stageCriteria[currentStage]}\n\nLearner has had ${body.failedAttempts} incomplete attempts in this stage. Use hint level ${hintLevel}/3: 0 = question only, 1 = point to a relevant concept, 2 = give a concrete next step, 3 = give a small illustrative example without a full solution.\n\nEvaluation rules:\n- Complete only when the learner demonstrates the required current-stage evidence.\n- If incomplete or incorrect, keep the learner in the current stage and ask a concise Socratic question matching the hint level.\n- If complete, acknowledge briefly and ask a concise question that starts the next stage.\n- strengths and improvements must each have at most two concise learner-specific points. encouragement must be one short sentence.\n- confidenceScore is an integer from 0 to 100.\n- sessionSummary must be null unless this is the Code stage and it is completed. ${isFinalEvaluation ? "For a completed Code stage, provide the concise session summary." : ""}\n\nConversation History:\n${history || "None"}\n\nLearner:\n${body.learnerResponse}`,
    });

    const evaluation = JSON.parse(response.output_text) as Omit<MentorEvaluation, "currentStage" | "nextStage" | "hintLevel"> & { sessionSummary: SessionSummary | null };
    if (typeof evaluation.mentorReply !== "string" || !isStringList(evaluation.strengths) || !isStringList(evaluation.improvements) || typeof evaluation.encouragement !== "string" || typeof evaluation.stageCompleted !== "boolean" || !Number.isInteger(evaluation.confidenceScore) || evaluation.confidenceScore < 0 || evaluation.confidenceScore > 100 || (evaluation.sessionSummary !== null && !isSessionSummary(evaluation.sessionSummary))) throw new Error("The mentor returned an invalid stage evaluation.");

    const result: MentorEvaluation = {
      mentorReply: evaluation.mentorReply,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      encouragement: evaluation.encouragement,
      currentStage,
      nextStage: evaluation.stageCompleted ? getNextStage(currentStage) : currentStage,
      stageCompleted: evaluation.stageCompleted,
      confidenceScore: evaluation.confidenceScore,
      hintLevel,
      ...(evaluation.sessionSummary ? { sessionSummary: evaluation.sessionSummary } : {}),
    };
    return NextResponse.json(result);
  } catch (error) {
    console.error("Mentor API Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown server error." }, { status: 500 });
  }
}
