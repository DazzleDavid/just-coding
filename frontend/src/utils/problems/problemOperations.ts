import { createUuid } from "../../lib/uuid"
import type { AssignmentData } from "../../services/shared/managementStorage"
import type { ProblemDraft } from "../../types/problem"
import type { TestCase, TestCaseDraft } from "../../types/testCase"
import { validateProblem, validateTestCase } from "./problemValidation"

export type ProblemAction =
  | { type: "save-problem"; draft: ProblemDraft; id?: string }
  | { type: "copy-problem" | "delete-problem"; id: string }
  | { type: "save-testcase"; problemId: string; draft: TestCaseDraft; id?: string }
  | { type: "save-testcases"; problemId: string; cases: TestCase[] }
  | { type: "copy-testcase" | "delete-testcase" | "toggle-testcase"; id: string }
  | { type: "move-testcase"; id: string; delta: -1 | 1 }

export function isProblemAction(action: { type: string }): action is ProblemAction {
  return [
    "save-problem",
    "copy-problem",
    "delete-problem",
    "save-testcase",
    "save-testcases",
    "copy-testcase",
    "delete-testcase",
    "toggle-testcase",
    "move-testcase",
  ].includes(action.type)
}
function requireValid(errors: object) {
  if (Object.keys(errors).length) throw new Error(Object.values(errors).join(" "))
}

export function applyProblemAction(source: AssignmentData, action: ProblemAction) {
  const data = structuredClone(source)
  const now = new Date().toISOString()
  let id = "id" in action ? (action.id ?? "") : ""
  const findProblem = (problemId: string) => {
    const problem = data.problems.find((item) => item.id === problemId)
    if (!problem) throw new Error("找不到題目。")
    return problem
  }
  if (action.type === "save-problem") {
    const draft = {
      ...action.draft,
      code: action.draft.code.trim(),
      title: action.draft.title.trim(),
      tags: [...new Set(action.draft.tags.map((tag) => tag.trim()).filter(Boolean))],
    }
    requireValid(validateProblem(draft, data.problems, action.id))
    if (draft.specialRuleIds.some((id) => !data.specialRules.some((rule) => rule.id === id)))
      throw new Error("選取的特殊規則不存在，請重新選擇。")
    if (action.id) {
      const problem = findProblem(action.id)
      Object.assign(problem, draft, { updatedAt: now })
    } else {
      id = createUuid()
      data.problems.push({ ...draft, id, createdAt: now, updatedAt: now })
    }
  } else if (action.type === "copy-problem" || action.type === "delete-problem") {
    const problem = findProblem(action.id)
    if (action.type === "delete-problem") {
      const references = data.assignmentProblems.filter((item) => item.problemId === problem.id)
      if (references.length)
        throw new Error(
          `此題目被 ${references.length} 份作業引用，請先至作業的題目配置移除引用，不能直接刪除。`,
        )
      data.problems = data.problems.filter((item) => item.id !== problem.id)
      data.testCases = data.testCases.filter((item) => item.problemId !== problem.id)
    } else {
      id = createUuid()
      let code = `${problem.code}-COPY`
      let suffix = 2
      while (data.problems.some((item) => item.code.toLowerCase() === code.toLowerCase()))
        code = `${problem.code}-COPY${suffix++}`
      data.problems.push({
        ...problem,
        id,
        code,
        title: `${problem.title}（副本）`,
        createdAt: now,
        updatedAt: now,
      })
      data.testCases
        .filter((item) => item.problemId === problem.id)
        .forEach((item) => data.testCases.push({ ...item, id: createUuid(), problemId: id }))
    }
  } else if (action.type === "save-testcases") {
    const problem = findProblem(action.problemId)
    const otherCases = data.testCases.filter((item) => item.problemId !== problem.id)
    const ids = new Set(otherCases.map((item) => item.id))
    action.cases.forEach((item, index) => {
      if (!item.id || ids.has(item.id) || item.problemId !== problem.id)
        throw new Error("測資編號重複或不屬於此題目。")
      ids.add(item.id)
      const errors = Object.values(validateTestCase(item))
      if (errors.length)
        throw new Error(`TC${String(index + 1).padStart(2, "0")}：${errors.join(" ")}`)
    })
    data.testCases = [
      ...otherCases,
      ...action.cases.map((item, order) => ({ ...item, name: item.name.trim(), order })),
    ]
    problem.updatedAt = now
    id = problem.id
  } else if (action.type === "save-testcase") {
    const problem = findProblem(action.problemId)
    requireValid(validateTestCase(action.draft))
    const draft = { ...action.draft, name: action.draft.name.trim() }
    if (action.id) {
      const item = data.testCases.find(
        (item) => item.id === action.id && item.problemId === problem.id,
      )
      if (!item) throw new Error("找不到測資。")
      Object.assign(item, draft)
    } else {
      id = createUuid()
      data.testCases.push({
        ...draft,
        id,
        problemId: problem.id,
        order: data.testCases.filter((item) => item.problemId === problem.id).length,
      })
    }
    problem.updatedAt = now
  } else {
    const item = data.testCases.find((item) => item.id === action.id)
    if (!item) throw new Error("找不到測資。")
    const problem = findProblem(item.problemId)
    if (action.type === "toggle-testcase") item.enabled = !item.enabled
    else if (action.type === "copy-testcase") {
      id = createUuid()
      data.testCases.push({
        ...item,
        id,
        name: `${item.name}（副本）`,
        order: data.testCases.filter((testCase) => testCase.problemId === problem.id).length,
      })
    } else if (action.type === "delete-testcase") {
      data.testCases = data.testCases.filter((testCase) => testCase.id !== item.id)
      data.testCases
        .filter((testCase) => testCase.problemId === problem.id)
        .sort((a, b) => a.order - b.order)
        .forEach((testCase, index) => {
          testCase.order = index
        })
    } else if (action.type === "move-testcase") {
      const own = data.testCases
        .filter((testCase) => testCase.problemId === problem.id)
        .sort((a, b) => a.order - b.order)
      const position = own.findIndex((testCase) => testCase.id === item.id)
      const next = position + action.delta
      if (next >= 0 && next < own.length) {
        ;[own[position], own[next]] = [own[next], own[position]]
        own.forEach((testCase, index) => {
          testCase.order = index
        })
      }
    }
    problem.updatedAt = now
  }
  return { data, id }
}
