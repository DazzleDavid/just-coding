import type { Assignment } from "../../types/assignment"
import type { AssignmentProblem } from "../../types/assignmentProblem"
import type { Problem } from "../../types/problem"
import type { TestCase } from "../../types/testCase"
import type { SpecialRule } from "../../types/specialRule"
import { validateSpecialRule } from "../../utils/problems/specialRules"
import { validateAssignment } from "../../utils/shared/assignmentSchema"
import { validateProblem, validateTestCase } from "../../utils/problems/problemValidation"

export type AssignmentData = {
  version: 2
  assignments: Assignment[]
  problems: Problem[]
  testCases: TestCase[]
  assignmentProblems: AssignmentProblem[]
  specialRules: SpecialRule[]
}
export const emptyAssignmentData = (): AssignmentData => ({
  version: 2,
  assignments: [],
  problems: [],
  testCases: [],
  assignmentProblems: [],
  specialRules: [],
})
export const assignmentStorageKey = "just-coding-management-v2"
const legacyKey = "just-coding-assignments-v1"
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null
const strings = (value: Record<string, unknown>, keys: string[]) =>
  keys.every((field) => typeof value[field] === "string")
const uniqueIds = (items: { id: string }[]) =>
  items.every((item) => !!item.id) && new Set(items.map((item) => item.id)).size === items.length

function isProblem(value: unknown): value is Problem {
  // Keep existing records and published snapshots readable; authoring enforces one language.
  return (
    record(value) &&
    strings(value, [
      "id",
      "code",
      "title",
      "statementMarkdown",
      "createdAt",
      "updatedAt",
      "outputComparisonMode",
      "difficulty",
    ]) &&
    Array.isArray(value.tags) &&
    Array.isArray(value.allowedLanguages) &&
    ["points", "timeLimitMs", "memoryLimitMb", "revision"].every(
      (field) => typeof value[field] === "number",
    ) &&
    Number.isInteger(value.revision) &&
    Number(value.revision) > 0 &&
    !Object.keys(validateProblem(value as Problem, [], undefined, { allowLegacyLanguages: true }))
      .length
  )
}
function isCase(value: unknown): value is TestCase {
  return (
    record(value) &&
    strings(value, ["id", "problemId", "name", "input", "expectedOutput", "visibility"]) &&
    typeof value.enabled === "boolean" &&
    Number.isInteger(value.order) &&
    Number(value.order) >= 0 &&
    !Object.keys(validateTestCase(value as TestCase)).length
  )
}

function isRule(value: unknown): value is SpecialRule {
  return (
    record(value) &&
    strings(value, ["id", "name", "content", "kind", "language", "createdAt", "updatedAt"]) &&
    !Object.keys(validateSpecialRule(value as SpecialRule)).length
  )
}

export function upgradeCodeCheckSettings(value: unknown) {
  const data = structuredClone(value)
  let changed = false
  const upgradeProblem = (problem: unknown) => {
    if (!record(problem)) return
    if (problem.similarityCheck === undefined) {
      problem.similarityCheck = { enabled: false, threshold: 80 }
      changed = true
    }
    if (problem.specialRuleIds === undefined) {
      problem.specialRuleIds = []
      changed = true
    }
    if (problem.specialRuleChecks === undefined) {
      problem.specialRuleChecks = []
      changed = true
    }
  }
  if (record(data) && data.version === 2) {
    if (data.specialRules === undefined) {
      data.specialRules = []
      changed = true
    }
    if (Array.isArray(data.problems)) data.problems.forEach(upgradeProblem)
    if (Array.isArray(data.assignmentProblems))
      data.assignmentProblems.forEach((relation) => {
        if (record(relation) && record(relation.publishedSnapshot)) {
          upgradeProblem(relation.publishedSnapshot.problem)
          if (relation.publishedSnapshot.specialRules === undefined) {
            relation.publishedSnapshot.specialRules = []
            changed = true
          }
        }
      })
  }
  return { data, changed }
}

export function isAssignmentData(value: unknown): value is AssignmentData {
  if (
    !record(value) ||
    value.version !== 2 ||
    !Array.isArray(value.assignments) ||
    !Array.isArray(value.problems) ||
    !Array.isArray(value.testCases) ||
    !Array.isArray(value.assignmentProblems) ||
    !Array.isArray(value.specialRules)
  )
    return false
  if (
    !value.assignments.every(
      (item) =>
        record(item) &&
        strings(item, [
          "id",
          "code",
          "title",
          "description",
          "startAt",
          "dueAt",
          "createdAt",
          "updatedAt",
        ]) &&
        Array.isArray(item.allowedLanguages) &&
        ["draft", "published", "archived"].includes(String(item.status)),
    )
  )
    return false
  if (!value.problems.every(isProblem) || !value.testCases.every(isCase)) return false
  if (
    !value.assignmentProblems.every(
      (item) =>
        record(item) &&
        strings(item, ["id", "assignmentId", "problemId"]) &&
        Number.isInteger(item.order) &&
        Number(item.order) >= 0 &&
        typeof item.points === "number" &&
        Number.isFinite(item.points) &&
        item.points > 0,
    )
  )
    return false
  const data = value as AssignmentData
  if (!data.specialRules.every(isRule) || !uniqueIds(data.specialRules)) return false
  if (
    ![data.assignments, data.problems, data.testCases, data.assignmentProblems].every((items) =>
      uniqueIds(items),
    )
  )
    return false
  if (
    data.assignments.some(
      (item) => Object.keys(validateAssignment(item, data.assignments, item.id)).length,
    )
  )
    return false
  if (
    data.problems.some(
      (item) =>
        Object.keys(validateProblem(item, data.problems, item.id, { allowLegacyLanguages: true }))
          .length,
    )
  )
    return false
  if (
    data.problems.some((item) =>
      item.specialRuleIds.some((id) => !data.specialRules.some((rule) => rule.id === id)),
    )
  )
    return false
  if (
    !data.testCases.every((item) => data.problems.some((problem) => problem.id === item.problemId))
  )
    return false
  const links = new Set<string>()
  return data.assignmentProblems.every((item) => {
    const assignment = data.assignments.find((parent) => parent.id === item.assignmentId)
    if (!assignment || !data.problems.some((problem) => problem.id === item.problemId)) return false
    const pair = JSON.stringify([item.assignmentId, item.problemId])
    if (links.has(pair)) return false
    links.add(pair)
    const snapshot = item.publishedSnapshot
    if (assignment.status === "published" && !snapshot) return false
    if (!snapshot) return true
    return (
      record(snapshot) &&
      typeof snapshot.versionId === "string" &&
      typeof snapshot.capturedAt === "string" &&
      Number.isFinite(Date.parse(snapshot.capturedAt)) &&
      isProblem(snapshot.problem) &&
      snapshot.problem.id === item.problemId &&
      Array.isArray(snapshot.testCases) &&
      snapshot.testCases.every(
        (testCase) => isCase(testCase) && testCase.problemId === item.problemId,
      ) &&
      uniqueIds(snapshot.testCases) &&
      Array.isArray(snapshot.specialRules) &&
      snapshot.specialRules.every(isRule) &&
      uniqueIds(snapshot.specialRules) &&
      snapshot.problem.specialRuleIds.every((id) =>
        snapshot.specialRules.some((rule) => rule.id === id),
      )
    )
  })
}

export function migrateAssignmentData(value: unknown): AssignmentData {
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.assignments) ||
    !Array.isArray(value.problems) ||
    !Array.isArray(value.testCases)
  )
    throw new Error("無法辨識舊版作業資料。")
  const problems: Problem[] = []
  const relations: AssignmentProblem[] = []
  value.problems.forEach((old, index) => {
    if (
      !record(old) ||
      typeof old.id !== "string" ||
      typeof old.assignmentId !== "string" ||
      !Number.isInteger(old.order)
    )
      throw new Error("舊版題目資料損壞，未遷移。")
    const { assignmentId, order, ...fields } = old
    const problem = {
      ...fields,
      code: `P${String(index + 1).padStart(4, "0")}`,
      difficulty: "easy",
      tags: [],
      revision: 1,
      similarityCheck: { enabled: false, threshold: 80 },
      specialRuleIds: [],
      specialRuleChecks: [],
    }
    if (!isProblem(problem)) throw new Error("舊版題目內容驗證失敗，已保留原始資料。")
    problems.push(problem)
    relations.push({
      id: `legacy-${old.id}`,
      assignmentId,
      problemId: old.id,
      order: Number(order),
      points: problem.points,
    })
  })
  const data = {
    version: 2,
    assignments: value.assignments,
    problems,
    testCases: value.testCases,
    assignmentProblems: relations,
    specialRules: [],
  } as AssignmentData
  for (const relation of relations) {
    const assignment = data.assignments.find((item) => item.id === relation.assignmentId)
    const problem = problems.find((item) => item.id === relation.problemId)!
    if (assignment && assignment.status !== "draft")
      relation.publishedSnapshot = {
        versionId: `legacy-${relation.id}`,
        capturedAt: assignment.updatedAt,
        problem: structuredClone(problem),
        testCases: structuredClone(data.testCases.filter((item) => item.problemId === problem.id)),
        specialRules: [],
      }
  }
  if (!isAssignmentData(data)) throw new Error("舊版資料驗證失敗，已保留原始資料並停止寫入。")
  return data
}

export function loadAssignmentData(): AssignmentData {
  const raw = localStorage.getItem(assignmentStorageKey)
  if (raw !== null) {
    const upgraded = upgradeCodeCheckSettings(JSON.parse(raw))
    if (!isAssignmentData(upgraded.data))
      throw new Error("管理資料格式不相容或損壞，已停止寫入以保留原始資料。")
    if (upgraded.changed) {
      try {
        const backup = `${assignmentStorageKey}-before-built-in-rules`
        if (localStorage.getItem(backup) === null) localStorage.setItem(backup, raw)
        saveAssignmentData(upgraded.data)
      } catch {
        throw new Error("程式碼檢查設定升級儲存失敗，原始資料已保留。")
      }
    }
    return upgraded.data
  }
  const legacy = localStorage.getItem(legacyKey)
  if (legacy === null) return emptyAssignmentData()
  const migrated = migrateAssignmentData(JSON.parse(legacy))
  saveAssignmentData(migrated)
  // Keep v1 unchanged as a migration backup; v2 is authoritative from now on.
  return migrated
}

export function saveAssignmentData(data: AssignmentData) {
  if (!isAssignmentData(data)) throw new Error("資料驗證失敗，尚未儲存。")
  try {
    localStorage.setItem(assignmentStorageKey, JSON.stringify(data))
  } catch {
    throw new Error("儲存失敗，請檢查瀏覽器儲存權限或剩餘空間。")
  }
}
