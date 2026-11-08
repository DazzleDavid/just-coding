import type { Language } from "./assignment"
import type { SpecialRuleCheck } from "./specialRule"

export type ComparisonMode = "strict" | "normalize-newlines" | "trim-line-end"
export type ProblemDraft = {
  code: string
  title: string
  difficulty: "easy" | "medium" | "hard"
  tags: string[]
  statementMarkdown: string
  points: number
  timeLimitMs: number
  memoryLimitMb: number
  outputComparisonMode: ComparisonMode
  allowedLanguages: Language[]
  similarityCheck: { enabled: boolean; threshold: number }
  specialRuleIds: string[]
  specialRuleChecks: SpecialRuleCheck[]
}
export type Problem = ProblemDraft & {
  id: string
  revision: number
  createdAt: string
  updatedAt: string
}
