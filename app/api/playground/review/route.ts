import OpenAI from "openai";
import { NextResponse } from "next/server";
import type { CodeReview, ExecutionResult } from "@/lib/playground";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function isExecutionResult(value: unknown): value is ExecutionResult { return typeof value === "object" && value !== null && Array.isArray((value as ExecutionResult).tests) && typeof (value as ExecutionResult).status === "string"; }

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY is missing." }, { status: 500 });
  try {
    const body = await request.json();
    if (typeof body.code !== "string" || body.code.length > 20_000 || !isExecutionResult(body.execution)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const response = await client.responses.create({ model: "gpt-5.6", reasoning: { effort: "low" }, instructions: "You are a supportive Java code reviewer. Review the learner's submission, not their potential solution. Never reveal a replacement implementation, pseudocode, algorithm steps, or code snippets. Be concise, specific, and constructive.", text: { format: { type: "json_schema", name: "code_review", strict: true, schema: { type: "object", additionalProperties: false, required: ["correctness", "logic", "edgeCases", "timeComplexity", "spaceComplexity", "improvementSuggestion"], properties: { correctness: { type: "string" }, logic: { type: "string" }, edgeCases: { type: "string" }, timeComplexity: { type: "string" }, spaceComplexity: { type: "string" }, improvementSuggestion: { type: "string" } } } } }, input: `Problem: Return indices of two distinct integers that sum to a target.\n\nLearner Java code:\n${body.code}\n\nExecution result:\n${JSON.stringify(body.execution)}\n\nAssess observed behavior. If tests are unavailable, say so rather than assuming they passed. Give exactly one actionable improvement suggestion, without explaining a better algorithm.` });
    return NextResponse.json(JSON.parse(response.output_text) as CodeReview);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to review the submitted code." }, { status: 500 }); }
}
