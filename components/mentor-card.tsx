"use client";

import { useEffect, useState } from "react";
import { Sparkle } from "./icons";

type ConversationMessage = { role: "learner" | "mentor"; content: string };

const currentStage = "Understand the problem";
const storageKey = "codecompile-mentor-conversation";

export function MentorCard() {
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const [mentorReply, setMentorReply] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedHistory = window.sessionStorage.getItem(storageKey);
    if (!storedHistory) return;
    try {
      const parsed = JSON.parse(storedHistory) as ConversationMessage[];
      if (Array.isArray(parsed)) {
        setHistory(parsed);
        const latestMentorReply = [...parsed].reverse().find((message) => message.role === "mentor");
        if (latestMentorReply) setMentorReply(latestMentorReply.content);
      }
    } catch { window.sessionStorage.removeItem(storageKey); }
  }, []);

  const shareThinking = async () => {
    const learnerResponse = answer.trim();
    if (!learnerResponse || isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/mentor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: currentStage, learnerResponse, history }) });
      const data = await response.json() as { reply?: string; error?: string };
      if (!response.ok || !data.reply) throw new Error(data.error || "Your mentor could not respond right now.");
      const nextHistory = [...history, { role: "learner" as const, content: learnerResponse }, { role: "mentor" as const, content: data.reply }];
      setHistory(nextHistory);
      window.sessionStorage.setItem(storageKey, JSON.stringify(nextHistory));
      setMentorReply(data.reply);
      setAnswer("");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Your mentor could not respond right now."); }
    finally { setIsLoading(false); }
  };

  return <section className="rounded-3xl border border-[#DDD6FF] bg-white p-6 shadow-soft">
    <div className="mb-6 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-lilac text-[#6957D9]"><Sparkle /></div><div><p className="font-bold">Your thinking partner</p><p className="text-sm text-slate-500">Stage 1 of 9 · Understand the problem</p></div></div>
    <div className="rounded-2xl bg-[#F7F5FF] p-5"><p className="mb-3 text-sm font-bold text-[#6957D9]">Let&apos;s start with your own words.</p><p className="text-lg font-semibold leading-7">What is this problem asking you to find, and what would a correct answer look like?</p></div>
    <label className="mt-6 block text-sm font-semibold text-slate-700" htmlFor="reasoning">Your reasoning</label>
    <textarea id="reasoning" value={answer} onChange={(event) => { setAnswer(event.target.value); setError(""); }} placeholder="Explain your understanding here. There is no need to write code yet." disabled={isLoading} className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-[#8C7AE6] focus:ring-4 focus:ring-[#EEE9FF] disabled:cursor-wait disabled:opacity-70" />
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Take your time—thinking is the work.</p><button onClick={shareThinking} disabled={!answer.trim() || isLoading} className="rounded-full bg-[#6957D9] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#5846C2] disabled:cursor-not-allowed disabled:opacity-40">{isLoading ? "Your mentor is thinking…" : "Share my thinking"}</button></div>
    {mentorReply && <div className="mt-4 rounded-xl bg-mint px-4 py-3 text-sm font-medium leading-6 text-[#177044]"><p className="mb-1 font-bold">Your mentor</p><p>{mentorReply}</p></div>}
    {error && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#A53A35]"><p>{error}</p><button onClick={shareThinking} disabled={isLoading || !answer.trim()} className="font-bold underline disabled:opacity-50">Retry</button></div>}
  </section>;
}
