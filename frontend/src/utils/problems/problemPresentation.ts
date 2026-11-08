import type { ProblemDraft } from "../../types/problem"
import type { TestCase } from "../../types/testCase"
import { specialRuleCatalog } from "../../data/problems/specialRuleCatalog"

export type PublicProblemView = {
  code: string
  title: string
  statementMarkdown: string
  points: number
  timeLimitMs: number
  memoryLimitMb: number
  allowedLanguages: string[]
  specialRules: { required: string[]; forbidden: string[] }
  examples: { name: string; input: string; expectedOutput: string }[]
}

// Project only student-visible fields; never pass hidden case data to the renderer.
export function publicProblemView(
  problem: ProblemDraft & { id?: string },
  cases: TestCase[],
): PublicProblemView {
  return {
    code: problem.code,
    title: problem.title,
    statementMarkdown: problem.statementMarkdown,
    points: problem.points,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
    allowedLanguages: [...problem.allowedLanguages],
    specialRules: {
      required: specialRuleCatalog
        .filter((item) =>
          problem.specialRuleChecks.some(
            (check) => check.feature === item.feature && check.mode === "required",
          ),
        )
        .map((item) => item.label),
      forbidden: specialRuleCatalog
        .filter((item) =>
          problem.specialRuleChecks.some(
            (check) => check.feature === item.feature && check.mode === "forbidden",
          ),
        )
        .map((item) => item.label),
    },
    examples: cases
      .filter(
        (item) => item.problemId === problem.id && item.enabled && item.visibility === "public",
      )
      .sort((left, right) => left.order - right.order)
      .map((item) => ({ name: item.name, input: item.input, expectedOutput: item.expectedOutput })),
  }
}
