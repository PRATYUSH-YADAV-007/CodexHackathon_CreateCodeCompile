import { NextResponse } from "next/server";

type ConversationMessage = { role: "learner" | "mentor"; content: string };

const problemStatement = "Given an array of integers and a target, find the indices of two numbers that add up to the target. Example: nums = [2, 7, 11, 15], target = 9, output = [0, 1].";

const mentorInstructions = `You are CodeCompile's Socratic programming mentor. Help the learner reason about a coding problem without immediately giving them a complete solution, final algorithm, or code.

Use the problem statement, learning stage, learner response, and conversation history provided. Be warm, concise, and specific. Start by acknowledging a useful part of their reasoning or gently correcting a misconception. Then ask one or two focused guiding questions that move their computational thinking forward. Give progressively stronger hints only when the learner is stuck or has asked for one; a hint should still leave meaningful reasoning for the learner. Focus on inputs, outputs, examples, assumptions, edge cases, patterns, and trade-offs appropriate to the current stage. Do not claim the learner is correct when their reasoning is incorrect. Do not reveal a complete solution or provide code unless the learner explicitly reaches the Implement stage and has already articulated the approach.`;

function isConversationHistory(value: unknown): value is ConversationMessage[] {
  return Array.isArray(value) && value.length <= 30 && value.every((message) => typeof message === "object" && message !== null && (message.role === "learner" || message.role === "mentor") && typeof message.content === "string" && message.content.length <= 4000);
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "The mentor is not configured. Add OPENAI_API_KEY to .env.local and restart the server." }, { status: 500 });

  let body: { stage?: unknown; learnerResponse?: unknown; history?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  if (typeof body.stage !== "string" || body.stage.length > 100 || typeof body.learnerResponse !== "string" || !body.learnerResponse.trim() || body.learnerResponse.length > 4000 || !isConversationHistory(body.history)) return NextResponse.json({ error: "Please provide a valid learning response." }, { status: 400 });

  const conversation = body.history.map((message) => `${message.role === "learner" ? "Learner" : "Mentor"}: ${message.content}`).join("\n");
  try {
    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: "gpt-5.6", reasoning: { effort: "low" }, instructions: mentorInstructions, input: `Problem statement:\n${problemStatement}\n\nCurrent learning stage: ${body.stage}\n\nPrevious conversation history:\n${conversation || "No previous messages."}\n\nLearner's latest response:\n${body.learnerResponse.trim()}` }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!openAIResponse.ok) {
      console.error("OpenAI Responses API error:", openAIResponse.status);
      return NextResponse.json({ error: "Your mentor could not respond right now. Please try again." }, { status: 502 });
    }
    const data = await openAIResponse.json() as { output_text?: unknown };
    if (typeof data.output_text !== "string" || !data.output_text.trim()) return NextResponse.json({ error: "Your mentor returned an empty response. Please try again." }, { status: 502 });
    return NextResponse.json({ reply: data.output_text.trim() });
  } catch (error) {
    console.error("Mentor request failed:", error);
    return NextResponse.json({ error: "Your mentor could not respond right now. Check your connection and try again." }, { status: 503 });
  }
}
