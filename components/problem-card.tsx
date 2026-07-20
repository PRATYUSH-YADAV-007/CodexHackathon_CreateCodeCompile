export function ProblemCard() {
  return <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-start justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-[#6957D9]">Today&apos;s practice</p><h2 className="text-2xl font-bold tracking-tight">Two Sum</h2></div><span className="rounded-full bg-[#E6F8ED] px-3 py-1 text-xs font-bold text-[#177044]">Foundations</span></div>
    <p className="leading-7 text-slate-600">Given an array of integers and a target, find the indices of two numbers that add up to the target.</p>
    <div className="my-5 rounded-2xl bg-slate-50 p-4 font-mono text-sm text-slate-600"><p>nums = [2, 7, 11, 15]</p><p>target = 9</p><p className="mt-2 text-[#6957D9]">output = [0, 1]</p></div>
    <div className="flex flex-wrap gap-2"><span className="rounded-full bg-lilac px-3 py-1 text-xs font-semibold text-[#5B46C3]">Arrays</span><span className="rounded-full bg-peach px-3 py-1 text-xs font-semibold text-[#A3532B]">Easy</span></div>
  </article>;
}
