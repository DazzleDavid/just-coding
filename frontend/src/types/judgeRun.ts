export const judgeStatuses = [
  "Pending",
  "Judging",
  "AC",
  "Partial",
  "WA",
  "TLE",
  "MLE",
  "RE",
  "CE",
  "SE",
] as const
export type JudgeStatus = (typeof judgeStatuses)[number]
export type TestCaseResult = {
  testCaseId: string
  verdict: JudgeStatus
  earnedScore: number
  executionTimeMs: number
  memoryUsedKb: number
}
export type JudgeRun = {
  id: string
  submissionId: string
  status: JudgeStatus
  score: number | null
  maxScore: number
  judgedAt: string | null
  assessmentKey: string
  valid: boolean
  testCaseResults: TestCaseResult[]
}
