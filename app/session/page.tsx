"use client";

import Link from "next/link";
import { useState } from "react";
import { MentorCard } from "@/components/mentor-card";
import { ProblemCard } from "@/components/problem-card";
import { LearningStage } from "@/components/learning-stage";
import { Mark } from "@/components/icons";
import { getStageIndex, type LearningStage as LearningStageName } from "@/lib/learning-stages";
import { createSessionAnalytics, type SessionAnalytics } from "@/lib/learning-session";
import { SessionStatistics } from "@/components/session-statistics";
import { CodePlayground } from "@/components/code-playground";

export default function SessionPage() {
  const [currentStage, setCurrentStage] = useState<LearningStageName>("Understand");
  const [analytics, setAnalytics] = useState<SessionAnalytics>(createSessionAnalytics);
  return <main className="min-h-screen"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"><Link href="/" className="flex items-center gap-3"><Mark /><span className="font-bold">CodeCompile</span></Link><span className="text-sm font-medium text-slate-500">Guided session</span><button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Save & exit</button></div></header><div className="mx-auto max-w-7xl px-5 py-7 sm:px-8"><LearningStage current={getStageIndex(currentStage)} /><div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,.86fr)_minmax(0,1.14fr)]"><div><ProblemCard /><aside className="mt-5 rounded-3xl bg-[#FFF0E8] p-6"><p className="text-sm font-bold text-[#A3532B]">A small promise</p><p className="mt-2 text-sm leading-6 text-slate-600">We won&apos;t jump to code. Start by making the problem feel completely clear.</p></aside><SessionStatistics analytics={analytics} /></div><div><MentorCard currentStage={currentStage} onStageChange={setCurrentStage} onAnalyticsChange={setAnalytics} /><CodePlayground /></div></div></div></main>;
}
