import type { Language } from "./assignment"

export type Submission = {
  id: string
  studentId: string
  assignmentId: string
  assignmentProblemId: string
  language: Language
  sourceCode: string
  submittedAt: string
  submissionNumber: number
  accepted: boolean
  voided: boolean
  deleted: boolean
  currentJudgeRunId: string | null
}
