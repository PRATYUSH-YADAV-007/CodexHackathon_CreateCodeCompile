"use client";

import { useEffect, useState } from "react";
import { Sparkle } from "./icons";
import { getStageIndex, isLearningStage, learningStages, type LearningStage } from "@/lib/learning-stages";

type ConversationMessage = { role: "learner" | "mentor"; content: string };
type MentorResponse = { mentorReply: string; currentStage: LearningStage; nextStage: LearningStage; stageCompleted: boolean; confidenceScore: number };
type StoredSession = { history: ConversationMessage[]; currentStage: LearningStage };
const storageKey = "codecompile-mentor-session";

export function MentorCard({ currentStage, onStageChange }: { currentStage: LearningStage; onStageChange: (stage: LearningStage) => void }) {
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const [mentorReply, setMentorReply] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedSession = window.sessionStorage.getItem(storageKey);
    if (!storedSession) return;
    try {
      const parsed = JSON.parse(storedSession) as StoredSession;
      if (!Array.isArray(parsed.history) || !isLearningStage(parsed.currentStage)) throw new Error("Invalid session");
      setHistory(parsed.history);
      onStageChange(parsed.currentStage);
      const latestReply = [...parsed.history].reverse().find((message) => message.role === "mentor");
      if (latestReply) setMentorReply(latestReply.content);
    } catch { window.sessionStorage.removeItem(storageKey); }
  }, [onStageChange]);

  const shareThinking = async () => {
    const learnerResponse = answer.trim();
    if (!learnerResponse || isLoading) return;
    setIsLoading(true); setError("");
    try {
      const response = await fetch("/api/mentor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: currentStage, learnerResponse, history }) });
      const data = await response.json() as Partial<MentorResponse> & { error?: string };
      if (!response.ok || typeof data.mentorReply !== "string" || !isLearningStage(data.nextStage)) throw new Error(data.error || "Your mentor could not respond right now.");
      const nextHistory = [...history, { role: "learner" as const, content: learnerResponse }, { role: "mentor" as const, content: data.mentorReply }];
      setHistory(nextHistory);
      window.sessionStorage.setItem(storageKey, JSON.stringify({ history: nextHistory, currentStage: data.nextStage }));
      setMentorReply(data.mentorReply); onStageChange(data.nextStage); setAnswer("");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Your mentor could not respond right now."); }
    finally { setIsLoading(false); }
  };

  const stageNumber = getStageIndex(currentStage) + 1;
  const initialPrompt = currentStage === "Code" ? "Share your code or pseudocode and explain any decisions you made." : `What is your thinking about the ${currentStage.toLowerCase()} stage?`;
  return <section className="rounded-3xl border border-[#DDD6FF] bg-white p-6 shadow-soft">
    <div className="mb-6 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-lilac text-[#6957D9]"><Sparkle /></div><div><p className="font-bold">Your thinking partner</p><p className="text-sm text-slate-500">Stage {stageNumber} of {learningStages.length} · {currentStage}</p></div></div>
    <div className="rounded-2xl bg-[#F7F5FF] p-5"><p className="mb-3 text-sm font-bold text-[#6957D9]">Let&apos;s work through this together.</p><p className="text-lg font-semibold leading-7">{mentorReply || initialPrompt}</p></div>
    <label className="mt-6 block text-sm font-semibold text-slate-700" htmlFor="reasoning">Your reasoning</label>
    <textarea id="reasoning" value={answer} onChange={(event) => { setAnswer(event.target.value); setError(""); }} placeholder="Explain your thinking here. There is no need to write code yet." disabled={isLoading} className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-[#8C7AE6] focus:ring-4 focus:ring-[#EEE9FF] disabled:cursor-wait disabled:opacity-70" />
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Take your time—thinking is the work.</p><button onClick={shareThinking} disabled={!answer.trim() || isLoading} className="rounded-full bg-[#6957D9] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#5846C2] disabled:cursor-not-allowed disabled:opacity-40">{isLoading ? "Your mentor is thinking…" : "Share my thinking"}</button></div>
    {error && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#A53A35]"><p>{error}</p><button onClick={shareThinking} disabled={isLoading || !answer.trim()} className="font-bold underline disabled:opacity-50">Retry</button></div>}
  </section>;
}
