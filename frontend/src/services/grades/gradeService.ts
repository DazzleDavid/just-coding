import { languages } from "../../types/assignment"
import { judgeStatuses } from "../../types/judgeRun"
import type { GradeData, GradeDemoData } from "../../types/grade"
import { isAssignmentData } from "../shared/managementStorage"

export const gradeStorageKey = "just-coding-grades-v1"
export const gradeDemoStorageKey = "just-coding-grade-demo-v1"
export const emptyGradeData = (): GradeData => ({
  version: 1,
  policies: [],
  submissions: [],
  judgeRuns: [],
})
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)
const strings = (value: Record<string, unknown>, keys: string[]) =>
  keys.every((key) => typeof value[key] === "string")
const unique = (values: unknown[]) => new Set(values).size === values.length

export function isGradeData(value: unknown): value is GradeData {
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.policies) ||
    !Array.isArray(value.submissions) ||
    !Array.isArray(value.judgeRuns)
  )
    return false
  if (
    !value.policies.every(
      (item) =>
        record(item) &&
        typeof item.assignmentId === "string" &&
        typeof item.countLate === "boolean",
    ) ||
    !unique(value.policies.map((item) => item.assignmentId))
  )
    return false
  if (
    !value.submissions.every(
      (item) =>
        record(item) &&
        strings(item, [
          "id",
          "studentId",
          "assignmentId",
          "assignmentProblemId",
          "language",
          "sourceCode",
          "submittedAt",
        ]) &&
        Number.isFinite(Date.parse(String(item.submittedAt))) &&
        languages.includes(item.language as (typeof languages)[number]) &&
        Number.isInteger(item.submissionNumber) &&
        Number(item.submissionNumber) > 0 &&
        ["accepted", "voided", "deleted"].every((key) => typeof item[key] === "boolean") &&
        (item.currentJudgeRunId === null || typeof item.currentJudgeRunId === "string"),
    ) ||
    !unique(value.submissions.map((item) => item.id))
  )
    return false
  return (
    value.judgeRuns.every(
      (item) =>
        record(item) &&
        strings(item, ["id", "submissionId", "status", "assessmentKey"]) &&
        judgeStatuses.includes(item.status as (typeof judgeStatuses)[number]) &&
        typeof item.valid === "boolean" &&
        (item.score === null ||
          (typeof item.score === "number" &&
            Number.isFinite(item.score) &&
            item.score >= 0 &&
            item.score <= Number(item.maxScore))) &&
        typeof item.maxScore === "number" &&
        Number.isFinite(item.maxScore) &&
        item.maxScore > 0 &&
        (item.judgedAt === null ||
          (typeof item.judgedAt === "string" && Number.isFinite(Date.parse(item.judgedAt)))) &&
        Array.isArray(item.testCaseResults) &&
        item.testCaseResults.every(
          (result) =>
            record(result) &&
            strings(result, ["testCaseId", "verdict"]) &&
            judgeStatuses.includes(result.verdict as (typeof judgeStatuses)[number]) &&
            ["earnedScore", "executionTimeMs", "memoryUsedKb"].every(
              (key) =>
                typeof result[key] === "number" &&
                Number.isFinite(result[key]) &&
                Number(result[key]) >= 0,
            ),
        ),
    ) && unique(value.judgeRuns.map((item) => item.id))
  )
}

function removeOldRosterSettings(value: unknown) {
  const data = structuredClone(value)
  let changed = false
  if (record(data) && Array.isArray(data.policies)) {
    data.policies.forEach((policy) => {
      if (record(policy) && Object.hasOwn(policy, "studentIds")) {
        delete policy.studentIds
        changed = true
      }
    })
  }
  return { data, changed }
}

export function loadGradeData(): GradeData {
  const raw = localStorage.getItem(gradeStorageKey)
  if (raw === null) return emptyGradeData()
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error("成績資料格式不正確，已保留原始資料並停止寫入。")
  }
  const cleaned = removeOldRosterSettings(value)
  if (!isGradeData(cleaned.data)) throw new Error("成績資料格式不正確，已保留原始資料並停止寫入。")
  if (cleaned.changed) {
    try {
      const backup = `${gradeStorageKey}-before-roster-removal`
      if (localStorage.getItem(backup) === null) localStorage.setItem(backup, raw)
      saveGradeData(cleaned.data)
    } catch {
      throw new Error("舊名單設定清理失敗，原始成績資料已保留。")
    }
  }
  return cleaned.data
}

export function isDemoGradeData(value: unknown): value is GradeDemoData {
  if (!isGradeData(value)) return false
  const workspace = (value as GradeDemoData).workspace
  if (workspace === undefined) return true
  if (
    !record(workspace) ||
    !isAssignmentData(workspace.management) ||
    !Array.isArray(workspace.students)
  )
    return false
  const students = workspace.students
  return (
    students.every(
      (student) =>
        record(student) &&
        strings(student, [
          "id",
          "studentNumber",
          "name",
          "className",
          "email",
          "notes",
          "createdAt",
          "updatedAt",
        ]) &&
        typeof student.active === "boolean",
    ) &&
    unique(students.map((student) => student.id)) &&
    unique(students.map((student) => student.studentNumber)) &&
    value.policies.every((policy) =>
      workspace.management.assignments.some((assignment) => assignment.id === policy.assignmentId),
    ) &&
    value.submissions.every(
      (submission) =>
        students.some((student) => student.id === submission.studentId) &&
        workspace.management.assignmentProblems.some(
          (relation) =>
            relation.id === submission.assignmentProblemId &&
            relation.assignmentId === submission.assignmentId,
        ),
    )
  )
}

export function loadDemoGradeData(): GradeDemoData | null {
  const raw = sessionStorage.getItem(gradeDemoStorageKey)
  if (raw === null) return null
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error("示範資料讀取失敗，請返回正式資料後重新載入示範。")
  }
  const cleaned = removeOldRosterSettings(value)
  if (!isDemoGradeData(cleaned.data))
    throw new Error("示範資料格式不正確，請返回正式資料後重新載入示範。")
  if (cleaned.changed) {
    try {
      const backup = `${gradeDemoStorageKey}-before-roster-removal`
      if (sessionStorage.getItem(backup) === null) sessionStorage.setItem(backup, raw)
      saveDemoGradeData(cleaned.data)
    } catch {
      throw new Error("舊名單設定清理失敗，原始示範資料已保留。")
    }
  }
  return cleaned.data
}

export function saveDemoGradeData(data: GradeDemoData | null) {
  if (data && !isDemoGradeData(data)) throw new Error("示範資料格式不正確。")
  try {
    if (data)
      sessionStorage.setItem(
        gradeDemoStorageKey,
        JSON.stringify(removeOldRosterSettings(data).data),
      )
    else sessionStorage.removeItem(gradeDemoStorageKey)
  } catch {
    throw new Error("無法儲存示範模式，請檢查瀏覽器工作階段儲存權限。")
  }
}

export function saveGradeData(data: GradeData) {
  if (!isGradeData(data)) throw new Error("成績資料驗證失敗，未儲存修改。")
  try {
    localStorage.setItem(gradeStorageKey, JSON.stringify(removeOldRosterSettings(data).data))
  } catch {
    throw new Error("無法儲存成績資料，請檢查瀏覽器儲存空間及權限。")
  }
}
