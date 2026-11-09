import type { Assignment, AssignmentDraft } from "../../types/assignment"
import type { AssignmentProblem } from "../../types/assignmentProblem"
import { localDateInput } from "./gradingUtils"

export type AssignmentProblemInput = { problemId: string; points: string }

export function assignmentInput(assignment?: Assignment): AssignmentDraft {
  return assignment
    ? {
        code: assignment.code,
        title: assignment.title,
        description: assignment.description,
        startAt: localDateInput(assignment.startAt),
        dueAt: localDateInput(assignment.dueAt),
      }
    : { code: "", title: "", description: "", startAt: "", dueAt: "" }
}

export function assignmentProblemInputs(assignmentId: string, relations: AssignmentProblem[]) {
  return relations
    .filter((item) => item.assignmentId === assignmentId)
    .sort((a, b) => a.order - b.order)
    .map((item) => ({ problemId: item.problemId, points: String(item.points) }))
}

export function assignmentSaveDraft(
  draft: AssignmentDraft,
  baseline: AssignmentDraft,
  current?: Assignment,
): AssignmentDraft {
  return {
    code: current?.status === "published" ? current.code : draft.code.trim(),
    title: draft.title.trim(),
    description: draft.description,
    startAt:
      current && (current.status === "published" || draft.startAt === baseline.startAt)
        ? current.startAt
        : new Date(draft.startAt).toISOString(),
    dueAt:
      current && draft.dueAt === baseline.dueAt
        ? current.dueAt
        : new Date(draft.dueAt).toISOString(),
  }
}
