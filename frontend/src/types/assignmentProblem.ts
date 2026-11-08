import type { Problem } from "./problem"
import type { TestCase } from "./testCase"
import type { SpecialRule } from "./specialRule"

export type ProblemSnapshot = {
  versionId: string
  capturedAt: string
  problem: Problem
  testCases: TestCase[]
  specialRules: SpecialRule[]
}

export type AssignmentProblem = {
  id: string
  assignmentId: string
  problemId: string
  order: number
  points: number
  publishedSnapshot?: ProblemSnapshot
}
