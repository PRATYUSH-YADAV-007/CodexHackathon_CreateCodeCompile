import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ConversationMessage = {
  role: "learner" | "mentor";
  content: string;
};

const problemStatement =
  "Given an array of integers and a target, find the indices of two numbers that add up to the target. Example: nums = [2, 7, 11, 15], target = 9, output = [0, 1].";

const mentorInstructions = `You are CodeCompile's Socratic programming mentor.

Your goal is to help learners THINK, not give solutions.

Rules:
- Never provide the complete solution or code.
- Ask 1-2 guiding questions.
- Give progressively stronger hints only if the learner is stuck.
- Encourage reasoning.
- Be concise.
- Respond in under 120 words.
`;

function isConversationHistory(value: unknown): value is ConversationMessage[] {
  return (
    Array.isArray(value) &&
    value.every(
      (m) =>
        typeof m === "object" &&
        m !== null &&
        (m.role === "learner" || m.role === "mentor") &&
        typeof m.content === "string"
    )
  );
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error: "OPENAI_API_KEY is missing.",
      },
      {
        status: 500,
      }
    );
  }

  try {
    const body = await request.json();

    if (
      typeof body.stage !== "string" ||
      typeof body.learnerResponse !== "string" ||
      !isConversationHistory(body.history)
    ) {
      return NextResponse.json(
        {
          error: "Invalid request.",
        },
        {
          status: 400,
        }
      );
    }

    const history = body.history
      .map(
        (m: ConversationMessage) =>
          `${m.role === "learner" ? "Learner" : "Mentor"}: ${m.content}`
      )
      .join("\n");

    const response = await client.responses.create({
      model: "gpt-5.6",
      reasoning: {
        effort: "low",
      },
      instructions: mentorInstructions,
      input: `Problem:
${problemStatement}

Current Stage:
${body.stage}

Conversation History:
${history || "None"}

Learner:
${body.learnerResponse}`,
    });

    return NextResponse.json({
      reply: response.output_text,
    });
  } catch (error) {
    console.error("Mentor API Error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown server error.",
      },
      {
        status: 500,
      }
    );
  }
}