import type { Assignment, AssignmentDraft } from "../../types/assignment"
import type { FieldErrors } from "../problems/problemValidation"

export function validateAssignment(
  draft: AssignmentDraft,
  existing: Assignment[],
  id?: string,
): FieldErrors<AssignmentDraft> {
  const errors: FieldErrors<AssignmentDraft> = {}
  if (!draft.code.trim()) errors.code = "請填寫作業編號。"
  else if (
    existing.some(
      (item) => item.id !== id && item.code.toLowerCase() === draft.code.trim().toLowerCase(),
    )
  )
    errors.code = "作業編號已存在。"
  if (!draft.title.trim()) errors.title = "請填寫作業名稱。"
  if (!Number.isFinite(Date.parse(draft.startAt))) errors.startAt = "請設定有效開放時間。"
  if (!Number.isFinite(Date.parse(draft.dueAt))) errors.dueAt = "請設定有效截止時間。"
  else if (Date.parse(draft.dueAt) <= Date.parse(draft.startAt))
    errors.dueAt = "截止時間必須晚於開放時間。"
  return errors
}
