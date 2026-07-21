export const learningStages = [
  "Understand", "Assumptions", "Approach", "Edge Cases", "Complexity", "Code",
] as const;

export type LearningStage = (typeof learningStages)[number];

export function isLearningStage(value: unknown): value is LearningStage {
  return typeof value === "string" && learningStages.includes(value as LearningStage);
}

export function getNextStage(stage: LearningStage): LearningStage {
  const index = learningStages.indexOf(stage);
  return learningStages[Math.min(index + 1, learningStages.length - 1)];
}

export function getStageIndex(stage: LearningStage): number {
  return learningStages.indexOf(stage);
}
