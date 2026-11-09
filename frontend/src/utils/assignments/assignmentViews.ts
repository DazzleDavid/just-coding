import type { AssignmentData } from "../../services/assignments/assignmentStorage"
import type { Assignment } from "../../types/assignment"

export function configuredProblems(data: AssignmentData, assignment: Assignment) {
  return data.assignmentProblems.filter((item) => item.assignmentId === assignment.id).sort((a, b) => a.order - b.order).map((relation) => {
    const frozen = assignment.status !== "draft" && relation.publishedSnapshot
    const problem = frozen ? frozen.problem : data.problems.find((item) => item.id === relation.problemId)
    const testCases = frozen ? frozen.testCases : data.testCases.filter((item) => item.problemId === relation.problemId)
    return { relation, problem, testCases, frozen: !!frozen }
  })
}
