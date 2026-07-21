"use client";

import { useState } from "react";
import { javaStarterCode, type CodeReview, type ExecutionResult } from "@/lib/playground";

const statusLabel: Record<ExecutionResult["status"], string> = { passed: "All tests passed", failed: "Some tests failed", runtime_error: "Runtime error", compile_error: "Compilation error", unavailable: "Execution unavailable" };

export function CodePlayground() {
  const [code, setCode] = useState(javaStarterCode);
  const [execution, setExecution] = useState<ExecutionResult>();
  const [review, setReview] = useState<CodeReview>();
  const [isRunning, setIsRunning] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState("");

  async function runTests() {
    setIsRunning(true); setReview(undefined); setError("");
    try {
      const response = await fetch("/api/playground/execute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await response.json() as ExecutionResult & { error?: string };
      if (!response.ok || !data.status || !Array.isArray(data.tests)) throw new Error(data.error || "Could not run your code.");
      setExecution(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not run your code."); }
    finally { setIsRunning(false); }
  }

  async function requestReview() {
    if (!execution) return;
    setIsReviewing(true); setError("");
    try {
      const response = await fetch("/api/playground/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, execution }) });
      const data = await response.json() as CodeReview & { error?: string };
      if (!response.ok || !data.correctness) throw new Error(data.error || "Could not review your code.");
      setReview(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not review your code."); }
    finally { setIsReviewing(false); }
  }

  return <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#6957D9]">Code playground</p><h2 className="mt-1 text-xl font-bold">Implement your solution</h2><p className="mt-1 text-sm text-slate-500">Java · Run the predefined tests when you&apos;re ready.</p></div><span className="rounded-full bg-lilac px-3 py-1 text-xs font-bold text-[#5B46C3]">Java</span></div>
    <label className="mt-5 block text-sm font-semibold text-slate-700" htmlFor="java-code">Your Java code</label>
    <textarea id="java-code" spellCheck={false} value={code} onChange={(event) => { setCode(event.target.value); setExecution(undefined); setReview(undefined); }} className="mt-2 min-h-72 w-full resize-y rounded-2xl border border-slate-800 bg-[#1C2434] p-4 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-[#A99BFF] focus:ring-4 focus:ring-[#EEE9FF]" aria-describedby="java-help" />
    <p id="java-help" className="mt-2 text-xs text-slate-500">Keep the provided <code>Solution.twoSum</code> method signature.</p>
    <div className="mt-4 flex flex-wrap gap-3"><button onClick={runTests} disabled={isRunning} className="rounded-full bg-[#6957D9] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#5846C2] disabled:cursor-wait disabled:opacity-50">{isRunning ? "Running tests…" : "Run tests"}</button>{execution && <button onClick={requestReview} disabled={isReviewing} className="rounded-full border border-[#6957D9] px-5 py-3 text-sm font-bold text-[#5B46C3] transition hover:bg-lilac disabled:cursor-wait disabled:opacity-50">{isReviewing ? "Reviewing…" : "Get AI review"}</button>}</div>
    {error && <p className="mt-4 rounded-xl border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#A53A35]">{error}</p>}
    {execution && <div className="mt-6"><div className="flex items-center justify-between gap-3"><h3 className="font-bold">Test results</h3><span className={`rounded-full px-3 py-1 text-xs font-bold ${execution.status === "passed" ? "bg-[#E6F8ED] text-[#177044]" : "bg-[#FFF0E8] text-[#A3532B]"}`}>{statusLabel[execution.status]}</span></div>{execution.error && <p className="mt-3 rounded-xl bg-slate-50 p-3 font-mono text-xs text-slate-600">{execution.error}</p>}{execution.tests.length > 0 && <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Input</th><th className="px-4 py-3">Expected</th><th className="px-4 py-3">Actual</th><th className="px-4 py-3">Result</th></tr></thead><tbody>{execution.tests.map((test) => <tr key={test.id} className="border-t border-slate-100"><td className="px-4 py-3 font-mono text-xs">[{test.input.nums.join(", ")}], {test.input.target}</td><td className="px-4 py-3 font-mono text-xs">[{test.expectedOutput.join(", ")}]</td><td className="px-4 py-3 font-mono text-xs">{test.actualOutput ? `[${test.actualOutput.join(", ")}]` : test.error || "—"}</td><td className={`px-4 py-3 text-xs font-bold ${test.passed ? "text-[#177044]" : "text-[#A53A35]"}`}>{test.passed ? "Pass" : "Fail"}</td></tr>)}</tbody></table></div>}</div>}
    {review && <div className="mt-6 rounded-2xl bg-[#F7F5FF] p-5"><h3 className="font-bold text-[#4E3DB2]">AI code review</h3><div className="mt-4 grid gap-4 text-sm leading-6 sm:grid-cols-2">{([["Correctness", review.correctness], ["Logic", review.logic], ["Edge cases", review.edgeCases], ["Time complexity", review.timeComplexity], ["Space complexity", review.spaceComplexity], ["One improvement", review.improvementSuggestion]] as const).map(([label, value]) => <div key={label}><p className="font-bold text-slate-700">{label}</p><p className="text-slate-600">{value}</p></div>)}</div></div>}
  </section>;
}
