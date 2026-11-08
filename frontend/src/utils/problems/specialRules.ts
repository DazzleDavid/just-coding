import { languages } from "../../types/assignment"
import type { SpecialRuleDraft } from "../../types/specialRule"

export function validateSpecialRule(
  draft: SpecialRuleDraft,
): Partial<Record<keyof SpecialRuleDraft, string>> {
  const errors: Partial<Record<keyof SpecialRuleDraft, string>> = {}
  if (!draft.name.trim()) errors.name = "請填寫規則名稱。"
  if (!draft.content.trim()) errors.content = "請填寫要檢查的文字。"
  if (!["required", "forbidden"].includes(draft.kind)) errors.kind = "請選擇必用或禁用。"
  if (draft.language !== "all" && !languages.includes(draft.language))
    errors.language = "請選擇有效的語言。"
  if (typeof draft.caseSensitive !== "boolean") errors.caseSensitive = "請設定大小寫比對方式。"
  if (typeof draft.enabled !== "boolean") errors.enabled = "請設定啟用狀態。"
  return errors
}
