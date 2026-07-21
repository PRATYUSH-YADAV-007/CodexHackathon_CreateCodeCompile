import type { MentorFeedback as MentorFeedbackData } from "@/lib/learning-session";

export function MentorFeedback({ feedback }: { feedback: MentorFeedbackData }) {
  return <div className="mt-5 grid gap-3 sm:grid-cols-2">
    <section className="rounded-2xl bg-[#F1FAF4] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#177044]">What&apos;s working</p><ul className="mt-2 space-y-1 text-sm text-slate-700">{feedback.strengths.map((strength) => <li key={strength}>• {strength}</li>)}</ul></section>
    <section className="rounded-2xl bg-[#FFF7E9] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#A3532B]">Refine next</p><ul className="mt-2 space-y-1 text-sm text-slate-700">{feedback.improvements.map((improvement) => <li key={improvement}>• {improvement}</li>)}</ul></section>
    <p className="sm:col-span-2 text-sm font-medium text-[#5B46C3]">{feedback.encouragement}</p>
  </div>;
}
