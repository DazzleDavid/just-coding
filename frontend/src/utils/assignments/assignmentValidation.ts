import type { Assignment } from "../../types/assignment"
import type { AssignmentProblem } from "../../types/assignmentProblem"
import type { Problem } from "../../types/problem"
import type { TestCase } from "../../types/testCase"
import { problemLabel } from "./gradingUtils"
import { problemIssues } from "../problems/problemValidation"
export type { FieldErrors } from "../problems/problemValidation"
import { validateAssignment } from "../shared/assignmentSchema"
export { validateAssignment } from "../shared/assignmentSchema"

export type PublishIssue = { message: string; path: string }
export function publishIssues(
  assignment: Assignment,
  assignments: Assignment[],
  problems: Problem[],
  cases: TestCase[],
  relations: AssignmentProblem[],
): PublishIssue[] {
  const base = `/assignments/${assignment.id}`
  const issues = Object.values(validateAssignment(assignment, assignments, assignment.id)).map(
    (message) => ({ message, path: `${base}#information` }),
  )
  const own = relations
    .filter((item) => item.assignmentId === assignment.id)
    .sort((a, b) => a.order - b.order)
  if (!own.length) issues.push({ message: "請從題庫加入至少一道題目。", path: `${base}#problems` })
  own.forEach((relation) => {
    const problem = problems.find((item) => item.id === relation.problemId)
    const label = `題目 ${problemLabel(relation.order)}`
    if (!problem) {
      issues.push({ message: `${label}：題庫題目不存在。`, path: `${base}#problems` })
      return
    }
    if (!Number.isFinite(relation.points) || relation.points <= 0)
      issues.push({ message: `${label}：作業內配分必須大於 0。`, path: `${base}#problems` })
    problemIssues(problem, cases).forEach((message) =>
      issues.push({
        message: `${label}（${problem.title}）：${message}`,
        path: `/problems/${problem.id}/${message.includes("測資") ? "edit#testcases" : "edit"}`,
      }),
    )
  })
  return issues
}
