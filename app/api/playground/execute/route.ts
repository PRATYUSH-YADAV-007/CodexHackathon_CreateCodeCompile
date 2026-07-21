import { NextResponse } from "next/server";
import { executeJava } from "@/lib/java-executor";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.code !== "string") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    return NextResponse.json(await executeJava(body.code));
  } catch { return NextResponse.json({ error: "Unable to execute the submitted code." }, { status: 500 }); }
}
