import { useState } from "react"
import type { Assignment, AssignmentDraft } from "../../types/assignment"
import { useUnsavedChanges } from "../useUnsavedChanges"
import { useAssignments } from "./useAssignments"
import { validateAssignment } from "../../utils/assignments/assignmentValidation"
import { localDateInput } from "../../utils/assignments/gradingUtils"
import {
  assignmentInput,
  assignmentProblemInputs,
  assignmentSaveDraft,
  type AssignmentProblemInput,
} from "../../utils/assignments/assignmentEditor"
import type { AssignmentAction } from "../../utils/assignments/assignmentOperations"
import type { FieldErrors } from "../../utils/problems/problemValidation"

type SaveAction = Extract<AssignmentAction, { type: "save-assignment" }>

export function useAssignmentEditor(assignment?: Assignment) {
  const { data, execute } = useAssignments()
  const [baseline, setBaseline] = useState(() => ({
    draft: assignmentInput(assignment),
    problems: assignment ? assignmentProblemInputs(assignment.id, data.assignmentProblems) : [],
  }))
  const [draft, setDraft] = useState(baseline.draft)
  const [problems, setProblems] = useState(baseline.problems)
  const [errors, setErrors] = useState<FieldErrors<AssignmentDraft>>({})
  const [failure, setFailure] = useState("")
  const [pendingDeadline, setPendingDeadline] = useState<SaveAction | null>(null)
  const dirty = JSON.stringify({ draft, problems }) !== JSON.stringify(baseline)
  const guard = useUnsavedChanges(dirty)

  function updateDraft(value: AssignmentDraft) {
    guard.markDirty()
    setDraft(value)
  }

  function updateProblems(value: AssignmentProblemInput[]) {
    guard.markDirty()
    setProblems(value)
  }

  function persist(action: SaveAction) {
    try {
      const id = execute(action, assignment ? "作業修改已儲存。" : "作業草稿已建立。")
      const saved = {
        draft: {
          ...action.draft,
          startAt: localDateInput(action.draft.startAt),
          dueAt: localDateInput(action.draft.dueAt),
        },
        problems: action.problemConfiguration
          ? action.problemConfiguration.map((item) => ({
              problemId: item.problemId,
              points: String(item.points),
            }))
          : problems,
      }
      setBaseline(saved)
      setDraft(saved.draft)
      setProblems(saved.problems)
      setFailure("")
      setPendingDeadline(null)
      guard.markSaved()
      return id
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "儲存失敗。")
      setPendingDeadline(null)
      return null
    }
  }

  function save() {
    const current = assignment && data.assignments.find((item) => item.id === assignment.id)
    if (assignment && !current) {
      setFailure("此作業已不存在，無法儲存。")
      return null
    }
    const errors = validateAssignment(draft, data.assignments, assignment?.id)
    setErrors(errors)
    setFailure("")
    if (Object.keys(errors).length) {
      setFailure("請檢查作業資訊中標示的欄位。")
      return null
    }
    const values = assignmentSaveDraft(draft, baseline.draft, current)
    const action: SaveAction = {
      type: "save-assignment",
      id: assignment?.id,
      draft: values,
      ...(current?.status === "draft" && {
        problemConfiguration: problems.map((item) => ({
          problemId: item.problemId,
          points: Number(item.points),
        })),
      }),
    }
    if (current?.status === "published" && Date.parse(values.dueAt) < Date.parse(current.dueAt)) {
      setPendingDeadline({
        ...action,
        deadlineConfirmation: { previousDueAt: current.dueAt, nextDueAt: values.dueAt },
      })
      return null
    }
    return persist(action)
  }

  function discard() {
    setDraft(baseline.draft)
    setProblems(baseline.problems)
    setErrors({})
    setFailure("")
    guard.markSaved()
  }

  return {
    draft,
    problems,
    errors,
    failure,
    dirty,
    guard,
    pendingDeadline,
    setPendingDeadline,
    updateDraft,
    updateProblems,
    save,
    discard,
    confirmDeadline: () => pendingDeadline && persist(pendingDeadline),
  }
}
