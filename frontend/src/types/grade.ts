import type { Student } from "../lib/students"
import type { Assignment } from "./assignment"
import type { AssignmentProblem } from "./assignmentProblem"
import type { Problem } from "./problem"
import type { Submission } from "./submission"
import type { JudgeRun } from "./judgeRun"
import type { AssignmentData } from "../services/shared/managementStorage"

export type AssignmentSubmissionPolicy = {
  assignmentId: string
  countLate: boolean
}
export type GradeData = {
  version: 1
  policies: AssignmentSubmissionPolicy[]
  submissions: Submission[]
  judgeRuns: JudgeRun[]
}
export type GradeDemoWorkspace = {
  management: AssignmentData
  students: Student[]
}
export type GradeDemoData = GradeData & { workspace?: GradeDemoWorkspace }
export type GradeInput = {
  students: Student[]
  assignments: Assignment[]
  assignmentProblems: AssignmentProblem[]
  problems: Problem[]
  gradeData: GradeData
  now: number
}
export type GradeState = "unsubmitted" | "pending" | "error" | "scored" | "unavailable"
export type SubmissionView = {
  submission: Submission
  student?: Student
  assignment?: Assignment
  relation?: AssignmentProblem
  problem?: Problem
  run?: JudgeRun
  validity: string | null
  score: number | null
  counted: boolean
}
