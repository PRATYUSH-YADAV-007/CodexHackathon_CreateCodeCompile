import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { twoSumTests, type ExecutionResult, type TestResult } from "@/lib/playground";

const execFileAsync = promisify(execFile);
const TIMEOUT_MS = 3_000;
const MAX_SOURCE_LENGTH = 20_000;

function validateJavaSource(source: string): string | undefined {
  if (!source.trim()) return "Enter Java code before running tests.";
  if (source.length > MAX_SOURCE_LENGTH) return "Code is too large to execute.";
  if (/\bpackage\s+|\bpublic\s+class\b/.test(source)) return "Use the provided Solution class without a package or public class declaration.";
  if (!/class\s+Solution\b/.test(source) || !/static\s+int\[\]\s+twoSum\s*\(/.test(source)) return "Keep the Solution class and static int[] twoSum(int[] nums, int target) method signature.";
  return undefined;
}

function harness(source: string) {
  const invocations = twoSumTests.map((test, index) => `run(${index}, new int[] {${test.input.nums.join(",")}}, ${test.input.target});`).join("\n    ");
  return `${source}\n\nclass Main {
  static void run(int id, int[] nums, int target) {
    try { System.out.println(id + \"|\" + java.util.Arrays.toString(Solution.twoSum(nums, target))); }
    catch (Throwable error) { System.out.println(id + \"|ERROR|\" + error.getClass().getSimpleName()); }
  }
  public static void main(String[] args) { ${invocations} }
}`;
}

function parseOutput(output: string): TestResult[] {
  const lines = output.trim().split(/\r?\n/);
  return twoSumTests.map((test, index) => {
    const line = lines.find((item) => item.startsWith(`${index}|`));
    if (!line) return { ...test, actualOutput: null, passed: false, error: "No output returned for this test." };
    if (line.includes("|ERROR|")) return { ...test, actualOutput: null, passed: false, error: line.split("|ERROR|")[1] || "Runtime error" };
    const values = line.slice(line.indexOf("|") + 1).match(/-?\d+/g);
    const actualOutput = values ? values.map(Number) : [];
    return { ...test, actualOutput, passed: JSON.stringify(actualOutput) === JSON.stringify(test.expectedOutput) };
  });
}

/**
 * Local execution is available by default only in development. Production always requires
 * an isolated runner service (container/VM) via EXECUTION_SERVICE_URL.
 */
export async function executeJava(source: string): Promise<ExecutionResult> {
  const validationError = validateJavaSource(source);
  if (validationError) return { status: "compile_error", tests: [], error: validationError };
  const runnerUrl = process.env.EXECUTION_SERVICE_URL;
  if (runnerUrl) {
    try {
      const response = await fetch(runnerUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: "java", source, tests: twoSumTests }), signal: AbortSignal.timeout(TIMEOUT_MS + 1_000) });
      const result = await response.json() as ExecutionResult;
      if (!response.ok || !Array.isArray(result.tests) || !["passed", "failed", "runtime_error", "compile_error"].includes(result.status)) throw new Error("The execution service returned an invalid response.");
      return result;
    } catch (error) { return { status: "unavailable", tests: [], error: error instanceof Error ? `The isolated execution service is unavailable: ${error.message}` : "The isolated execution service is unavailable." }; }
  }
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_LOCAL_JAVA_EXECUTION === "false") {
    return { status: "unavailable", tests: [], error: "Code execution is not configured. Connect an isolated execution service for production, or enable the local development runner." };
  }

  const directory = await mkdtemp(join(tmpdir(), "codecompile-java-"));
  try {
    await writeFile(join(directory, "Main.java"), harness(source), "utf8");
    try { await execFileAsync("javac", ["Main.java"], { cwd: directory, timeout: TIMEOUT_MS, maxBuffer: 32_000, windowsHide: true }); }
    catch (error) { return { status: "compile_error", tests: [], error: error instanceof Error ? error.message : "Compilation failed." }; }
    try {
      const { stdout } = await execFileAsync("java", ["-Xmx64m", "-XX:ActiveProcessorCount=1", "Main"], { cwd: directory, timeout: TIMEOUT_MS, maxBuffer: 32_000, windowsHide: true });
      const tests = parseOutput(stdout);
      const hasRuntimeErrors = tests.some((test) => test.error);
      return { status: tests.every((test) => test.passed) ? "passed" : hasRuntimeErrors ? "runtime_error" : "failed", tests };
    } catch (error) { return { status: "runtime_error", tests: [], error: error instanceof Error ? error.message : "Execution failed." }; }
  } finally { await rm(directory, { recursive: true, force: true }); }
}
