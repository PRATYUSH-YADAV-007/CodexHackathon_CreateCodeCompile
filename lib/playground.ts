export type PlaygroundTestCase = {
  id: string;
  input: { nums: number[]; target: number };
  expectedOutput: number[];
};

export const javaStarterCode = `class Solution {
  public static int[] twoSum(int[] nums, int target) {
    // Write your solution here.
    return new int[] {};
  }
}`;

export const twoSumTests: PlaygroundTestCase[] = [
  { id: "basic-pair", input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
  { id: "later-pair", input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] },
  { id: "duplicates", input: { nums: [3, 3], target: 6 }, expectedOutput: [0, 1] },
  { id: "negative-values", input: { nums: [-1, -2, -3, -4, -5], target: -8 }, expectedOutput: [2, 4] },
];

export type TestResult = PlaygroundTestCase & {
  actualOutput: number[] | null;
  passed: boolean;
  error?: string;
};

export type ExecutionResult = {
  status: "passed" | "failed" | "runtime_error" | "compile_error" | "unavailable";
  tests: TestResult[];
  error?: string;
};

export type CodeReview = {
  correctness: string;
  logic: string;
  edgeCases: string;
  timeComplexity: string;
  spaceComplexity: string;
  improvementSuggestion: string;
};
