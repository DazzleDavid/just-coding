import { languages } from "../../types/assignment"
import type { Problem, ProblemDraft } from "../../types/problem"
import type { TestCase, TestCaseDraft } from "../../types/testCase"
import { specialRuleCatalog } from "../../data/problems/specialRuleCatalog"

export type FieldErrors<T> = Partial<Record<keyof T, string>>

export function validateProblem(draft: ProblemDraft, existing: Problem[] = [], id?: string, options: { allowLegacyLanguages?: boolean } = {}): FieldErrors<ProblemDraft> {
  const errors: FieldErrors<ProblemDraft> = {}
  if (!draft.code.trim()) errors.code = "請填寫題目編號。"
  else if (existing.some((item) => item.id !== id && item.code.toLowerCase() === draft.code.trim().toLowerCase())) errors.code = "題目編號已存在。"
  if (!draft.title.trim()) errors.title = "請填寫題目名稱。"
  if (!["easy", "medium", "hard"].includes(draft.difficulty)) errors.difficulty = "請選擇有效難度。"
  if (!Array.isArray(draft.tags) || draft.tags.some((tag) => typeof tag !== "string" || !tag.trim())) errors.tags = "標籤不可為空白。"
  if (!Number.isFinite(draft.points) || draft.points <= 0) errors.points = "預設配分必須大於 0。"
  if (!Number.isInteger(draft.timeLimitMs) || draft.timeLimitMs < 1 || draft.timeLimitMs > 60000) errors.timeLimitMs = "時間限制須為 1–60,000 ms 的整數。"
  if (!Number.isInteger(draft.memoryLimitMb) || draft.memoryLimitMb < 1 || draft.memoryLimitMb > 4096) errors.memoryLimitMb = "記憶體限制須為 1–4,096 MB 的整數。"
  if (!(options.allowLegacyLanguages ? draft.allowedLanguages.length > 0 : draft.allowedLanguages.length === 1) || draft.allowedLanguages.some((language) => !languages.includes(language))) errors.allowedLanguages = "請選擇一種支援的語言。"
  if (!["strict", "normalize-newlines", "trim-line-end"].includes(draft.outputComparisonMode)) errors.outputComparisonMode = "請選擇有效的輸出比較模式。"
  if (!draft.similarityCheck || typeof draft.similarityCheck.enabled !== "boolean" || !Number.isInteger(draft.similarityCheck.threshold) || draft.similarityCheck.threshold < 1 || draft.similarityCheck.threshold > 100) errors.similarityCheck = "相似度門檻須為 1–100 的整數百分比。"
  if (!Array.isArray(draft.specialRuleIds) || draft.specialRuleIds.some((id) => typeof id !== "string") || new Set(draft.specialRuleIds).size !== draft.specialRuleIds.length) errors.specialRuleIds = "特殊規則選擇不正確。"
  if (!Array.isArray(draft.specialRuleChecks) || draft.specialRuleChecks.some((check) => !check || !specialRuleCatalog.some((item) => item.feature === check.feature) || !["required", "forbidden"].includes(check.mode)) || new Set(draft.specialRuleChecks.map((check) => check?.feature)).size !== draft.specialRuleChecks.length) errors.specialRuleChecks = "特殊規則檢查設定不正確，同一項目不可同時必用與禁用。"
  return errors
}

export function validateTestCase(draft: TestCaseDraft): FieldErrors<TestCaseDraft> {
  const errors: FieldErrors<TestCaseDraft> = {}
  if (!draft.name.trim()) errors.name = "請填寫測資名稱。"
  if (!["public", "hidden"].includes(draft.visibility)) errors.visibility = "請選擇公開或隱藏。"
  return errors
}

export function problemIssues(problem: Problem, cases: TestCase[]): string[] {
  const issues = Object.values(validateProblem(problem))
  if (!problem.statementMarkdown.trim()) issues.push("題目敘述不可空白。")
  const own = cases.filter((item) => item.problemId === problem.id)
  own.forEach((item) => Object.values(validateTestCase(item)).forEach((error) => issues.push(`${item.name}：${error}`)))
  if (!own.some((item) => item.enabled)) issues.push("至少需要一筆啟用測資。")
  return issues
}
