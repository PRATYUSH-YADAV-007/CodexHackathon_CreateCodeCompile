import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getNextStage, isLearningStage, type LearningStage } from "@/lib/learning-stages";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type ConversationMessage = { role: "learner" | "mentor"; content: string };
type MentorEvaluation = {
  mentorReply: string;
  currentStage: LearningStage;
  nextStage: LearningStage;
  stageCompleted: boolean;
  confidenceScore: number;
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

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY is missing." }, { status: 500 });

  try {
    const body = await request.json();
    if (!isLearningStage(body.stage) || typeof body.learnerResponse !== "string" || !isConversationHistory(body.history)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const currentStage: LearningStage = body.stage;

    const history = body.history.map((message: ConversationMessage) => `${message.role === "learner" ? "Learner" : "Mentor"}: ${message.content}`).join("\n");
    const response = await client.responses.create({
      model: "gpt-5.6",
      reasoning: { effort: "low" },
      instructions: mentorInstructions,
      text: { format: { type: "json_schema", name: "mentor_stage_evaluation", strict: true, schema: {
        type: "object", additionalProperties: false, required: ["mentorReply", "stageCompleted", "confidenceScore"],
        properties: { mentorReply: { type: "string" }, stageCompleted: { type: "boolean" }, confidenceScore: { type: "integer", minimum: 0, maximum: 100 } },
      } } },
      input: `Problem:\n${problemStatement}\n\nCurrent Stage:\n${currentStage}\n\nEvidence required to complete this stage:\n${stageCriteria[currentStage]}\n\nEvaluation rules:\n- Complete only when the learner demonstrates the required current-stage evidence.\n- If incomplete or incorrect, keep the learner in the current stage and ask a Socratic question.\n- If complete, acknowledge briefly and ask a Socratic question that starts the next stage.\n- confidenceScore is an integer from 0 to 100.\n\nConversation History:\n${history || "None"}\n\nLearner:\n${body.learnerResponse}`,
    });

    const evaluation = JSON.parse(response.output_text) as Omit<MentorEvaluation, "currentStage" | "nextStage">;
    if (typeof evaluation.mentorReply !== "string" || typeof evaluation.stageCompleted !== "boolean" || !Number.isInteger(evaluation.confidenceScore) || evaluation.confidenceScore < 0 || evaluation.confidenceScore > 100) throw new Error("The mentor returned an invalid stage evaluation.");

    const result: MentorEvaluation = {
      mentorReply: evaluation.mentorReply,
      currentStage,
      nextStage: evaluation.stageCompleted ? getNextStage(currentStage) : currentStage,
      stageCompleted: evaluation.stageCompleted,
      confidenceScore: evaluation.confidenceScore,
    };
    return NextResponse.json(result);
  } catch (error) {
    console.error("Mentor API Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown server error." }, { status: 500 });
  }
}
