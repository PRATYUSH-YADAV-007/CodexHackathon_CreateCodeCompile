export const learningStages = ["Understand", "Assumptions", "Edge cases", "Approach", "Data structure", "Algorithm", "Complexity", "Implement", "Reflect"];

export function LearningStage({ current = 0 }: { current?: number }) {
  return <div className="overflow-x-auto pb-2"><ol className="flex min-w-max items-center gap-1">
    {learningStages.map((stage, index) => <li key={stage} className="flex items-center gap-1">
      <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${index === current ? "bg-[#6957D9] text-white" : index < current ? "bg-[#DFF5E8] text-[#177044]" : "bg-slate-100 text-slate-400"}`}>{index < current ? "✓" : index + 1}</span>
      <span className={`mr-2 text-xs font-medium ${index === current ? "text-[#6957D9]" : "text-slate-400"}`}>{stage}</span>
    </li>)}
  </ol></div>;
}
