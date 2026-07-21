import type { SessionAnalytics } from "@/lib/learning-session";

function formatElapsedTime(startedAt: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - startedAt) / 60000));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function SessionStatistics({ analytics }: { analytics: SessionAnalytics }) {
  return <aside className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-bold">Session statistics</p><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-slate-500">Stages completed</dt><dd className="mt-1 text-xl font-bold">{analytics.completedStages.length}/6</dd></div><div><dt className="text-slate-500">Mentor interactions</dt><dd className="mt-1 text-xl font-bold">{analytics.totalInteractions}</dd></div><div><dt className="text-slate-500">Hints used</dt><dd className="mt-1 text-xl font-bold">{analytics.hintsUsed}</dd></div><div><dt className="text-slate-500">Learning time</dt><dd className="mt-1 text-xl font-bold">{formatElapsedTime(analytics.startedAt)}</dd></div></dl></aside>;
}
