"use client";

import { useEffect, useState } from "react";
import { Sparkle } from "./icons";
import { MentorFeedback } from "./mentor-feedback";
import { SessionSummary } from "./session-summary";
import { getStageIndex, isLearningStage, learningStages, type LearningStage } from "@/lib/learning-stages";
import { createSessionAnalytics, isSessionAnalytics, type MentorFeedback as MentorFeedbackData, type MentorResponse, type SessionAnalytics, type StoredSession } from "@/lib/learning-session";

const storageKey = "codecompile-mentor-session";

type Props = { currentStage: LearningStage; onStageChange: (stage: LearningStage) => void; onAnalyticsChange: (analytics: SessionAnalytics) => void };

export function MentorCard({ currentStage, onStageChange, onAnalyticsChange }: Props) {
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<StoredSession["history"]>([]);
  const [analytics, setAnalytics] = useState<SessionAnalytics>(createSessionAnalytics);
  const [feedback, setFeedback] = useState<MentorFeedbackData>();
  const [summary, setSummary] = useState<StoredSession["summary"]>();
  const [mentorReply, setMentorReply] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = window.sessionStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as StoredSession;
      if (!Array.isArray(parsed.history) || !isLearningStage(parsed.currentStage)) throw new Error("Invalid session");
      const restoredAnalytics = isSessionAnalytics(parsed.analytics) ? parsed.analytics : createSessionAnalytics();
      setHistory(parsed.history); setAnalytics(restoredAnalytics); onAnalyticsChange(restoredAnalytics); onStageChange(parsed.currentStage);
      setFeedback(parsed.latestFeedback); setSummary(parsed.summary);
      const latestReply = [...parsed.history].reverse().find((message) => message.role === "mentor");
      if (latestReply) setMentorReply(latestReply.content);
    } catch { window.sessionStorage.removeItem(storageKey); }
  // Session restoration intentionally happens once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSession = (next: StoredSession) => window.sessionStorage.setItem(storageKey, JSON.stringify(next));

  const shareThinking = async () => {
    const learnerResponse = answer.trim();
    if (!learnerResponse || isLoading || summary) return;
    setIsLoading(true); setError("");
    const failedAttempts = analytics.stageAttempts[currentStage] ?? 0;
    try {
      const response = await fetch("/api/mentor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: currentStage, learnerResponse, history, failedAttempts }) });
      const data = await response.json() as Partial<MentorResponse> & { error?: string };
      if (!response.ok || typeof data.mentorReply !== "string" || !isLearningStage(data.nextStage) || !Array.isArray(data.strengths) || !Array.isArray(data.improvements) || typeof data.encouragement !== "string" || typeof data.confidenceScore !== "number" || typeof data.hintLevel !== "number") throw new Error(data.error || "Your mentor could not respond right now.");
      const nextHistory = [...history, { role: "learner" as const, content: learnerResponse }, { role: "mentor" as const, content: data.mentorReply }];
      const completedStages = data.stageCompleted && !analytics.completedStages.includes(currentStage) ? [...analytics.completedStages, currentStage] : analytics.completedStages;
      const nextAnalytics: SessionAnalytics = { ...analytics, completedStages, totalInteractions: analytics.totalInteractions + 1, hintsUsed: analytics.hintsUsed + (data.hintLevel > 0 ? 1 : 0), latestConfidenceScore: data.confidenceScore, stageAttempts: { ...analytics.stageAttempts, [currentStage]: data.stageCompleted ? 0 : failedAttempts + 1 } };
      const nextFeedback: MentorFeedbackData = { mentorReply: data.mentorReply, strengths: data.strengths, improvements: data.improvements, encouragement: data.encouragement, confidenceScore: data.confidenceScore, hintLevel: data.hintLevel };
      const nextSession: StoredSession = { history: nextHistory, currentStage: data.nextStage, analytics: nextAnalytics, latestFeedback: nextFeedback, ...(data.sessionSummary ? { summary: data.sessionSummary } : {}) };
      setHistory(nextHistory); setAnalytics(nextAnalytics); setFeedback(nextFeedback); setSummary(data.sessionSummary); setMentorReply(data.mentorReply); saveSession(nextSession); onAnalyticsChange(nextAnalytics); onStageChange(data.nextStage); setAnswer("");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Your mentor could not respond right now."); }
    finally { setIsLoading(false); }
  };

  const stageNumber = getStageIndex(currentStage) + 1;
  const initialPrompt = currentStage === "Code" ? "Share your code or pseudocode and explain any decisions you made." : `What is your thinking about the ${currentStage.toLowerCase()} stage?`;
  const hintLevel = feedback?.hintLevel ?? analytics.stageAttempts[currentStage] ?? 0;
  return <section className="rounded-3xl border border-[#DDD6FF] bg-white p-6 shadow-soft">
    <div className="mb-6 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-lilac text-[#6957D9]"><Sparkle /></div><div><p className="font-bold">Your thinking partner</p><p className="text-sm font-medium text-slate-500">Stage {stageNumber} of {learningStages.length} · {currentStage}</p></div></div>
    <div className="rounded-2xl bg-[#F7F5FF] p-5"><div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-bold text-[#6957D9]">Let&apos;s work through this together.</p><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#6957D9]">Hint level {Math.min(hintLevel, 3)}/3</span></div><p className="text-lg font-semibold leading-7">{mentorReply || initialPrompt}</p></div>
    {feedback && <><div className="mt-5"><div className="flex justify-between text-xs font-bold text-slate-500"><span>Confidence</span><span>{feedback.confidenceScore}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#6957D9] transition-all" style={{ width: `${feedback.confidenceScore}%` }} /></div></div><MentorFeedback feedback={feedback} /></>}
    {summary ? <SessionSummary summary={summary} /> : <><label className="mt-6 block text-sm font-semibold text-slate-700" htmlFor="reasoning">Your reasoning</label><textarea id="reasoning" value={answer} onChange={(event) => { setAnswer(event.target.value); setError(""); }} placeholder="Explain your thinking here. There is no need to write code yet." disabled={isLoading} className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-[#8C7AE6] focus:ring-4 focus:ring-[#EEE9FF] disabled:cursor-wait disabled:opacity-70" /><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Take your time—thinking is the work.</p><button onClick={shareThinking} disabled={!answer.trim() || isLoading} className="rounded-full bg-[#6957D9] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#5846C2] disabled:cursor-not-allowed disabled:opacity-40">{isLoading ? "Your mentor is thinking…" : "Share my thinking"}</button></div>{error && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#A53A35]"><p>{error}</p><button onClick={shareThinking} disabled={isLoading || !answer.trim()} className="font-bold underline disabled:opacity-50">Retry</button></div>}</>}
  </section>;
}
