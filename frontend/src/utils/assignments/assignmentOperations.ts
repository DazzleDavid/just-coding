import { createUuid } from "../../lib/uuid"
import type { AssignmentData } from "../../services/assignments/assignmentStorage"
import type {
  AssignmentDraft,
  AssignmentStatus,
  DeadlineShorteningConfirmation,
} from "../../types/assignment"
import type { AssignmentProblemConfiguration } from "../../types/assignmentProblem"
import { publishIssues, validateAssignment } from "./assignmentValidation"
import {
  applyProblemAction,
  isProblemAction,
  type ProblemAction,
} from "../problems/problemOperations"

export type AssignmentAction =
  | ProblemAction
  | {
      type: "save-assignment"
      draft: AssignmentDraft
      id?: string
      deadlineConfirmation?: DeadlineShorteningConfirmation
      problemConfiguration?: AssignmentProblemConfiguration[]
    }
  | { type: "status"; id: string; status: AssignmentStatus }
  | { type: "copy-assignment" | "delete-assignment"; id: string }
  | { type: "add-problems"; assignmentId: string; problemIds: string[] }
  | { type: "remove-assignment-problem"; id: string }
  | { type: "set-problem-points"; id: string; points: number }
  | { type: "move-assignment-problem"; id: string; delta: -1 | 1 }

export function applyAssignmentAction(
  source: AssignmentData,
  action: AssignmentAction,
): { data: AssignmentData; id: string } {
  if (isProblemAction(action)) return applyProblemAction(source, action)
  const data = structuredClone(source)
  const now = new Date().toISOString()
  const findAssignment = (id: string) => {
    const assignment = data.assignments.find((item) => item.id === id)
    if (!assignment) throw new Error("找不到作業。")
    return assignment
  }
  const editable = (id: string) => {
    const assignment = findAssignment(id)
    if (assignment.status !== "draft")
      throw new Error("題目配置僅能在草稿狀態修改，請先取消發布或還原為草稿。")
    assignment.updatedAt = now
    return assignment
  }
  let id = "id" in action ? (action.id ?? "") : ""
  switch (action.type) {
    case "save-assignment": {
      const current = action.id ? findAssignment(action.id) : undefined
      if (current?.status === "archived") throw new Error("封存作業為唯讀，無法修改。")
      const draft = {
        code: action.draft.code.trim(),
        title: action.draft.title.trim(),
        description: action.draft.description,
        startAt: action.draft.startAt,
        dueAt: action.draft.dueAt,
      }
      const errors = validateAssignment(draft, data.assignments, action.id)
      if (Object.keys(errors).length) throw new Error(Object.values(errors).join(" "))
      if (action.problemConfiguration !== undefined && current?.status === "published")
        throw new Error("已發布作業不可修改題目配置或配分。")
      if (current?.status === "published") {
        if (draft.code !== current.code.trim()) throw new Error("已發布作業不可修改作業編號。")
        if (Date.parse(draft.startAt) !== Date.parse(current.startAt))
          throw new Error("已發布作業不可修改開放時間。")
        if (Date.parse(draft.dueAt) < Date.parse(current.dueAt)) {
          const confirmation = action.deadlineConfirmation
          if (
            !confirmation ||
            Date.parse(confirmation.previousDueAt) !== Date.parse(current.dueAt) ||
            Date.parse(confirmation.nextDueAt) !== Date.parse(draft.dueAt)
          ) {
            throw new Error("縮短截止時間前須再次確認；時間已變更時，請重新確認。")
          }
        }
        Object.assign(current, {
          title: draft.title,
          description: draft.description,
          dueAt: draft.dueAt,
          updatedAt: now,
        })
      } else if (action.id) Object.assign(editable(action.id), draft)
      else {
        id = createUuid()
        data.assignments.push({ ...draft, id, status: "draft", createdAt: now, updatedAt: now })
      }
      if (action.problemConfiguration !== undefined) {
        const seen = new Set<string>()
        const relations = action.problemConfiguration.map((item, order) => {
          if (seen.has(item.problemId)) throw new Error("同一份作業不可重複加入相同題目。")
          seen.add(item.problemId)
          if (!data.problems.some((problem) => problem.id === item.problemId))
            throw new Error(`題目 ${order + 1} 不存在，請重新選擇。`)
          if (!Number.isFinite(item.points) || item.points <= 0)
            throw new Error(`題目 ${order + 1} 的作業內配分必須大於 0。`)
          const previous = data.assignmentProblems.find(
            (relation) => relation.assignmentId === id && relation.problemId === item.problemId,
          )
          return {
            id: previous?.id ?? createUuid(),
            assignmentId: id,
            problemId: item.problemId,
            order,
            points: item.points,
          }
        })
        data.assignmentProblems = [
          ...data.assignmentProblems.filter((relation) => relation.assignmentId !== id),
          ...relations,
        ]
      }
      break
    }
    case "status": {
      const assignment = findAssignment(action.id)
      const own = data.assignmentProblems.filter((item) => item.assignmentId === assignment.id)
      if (action.status === assignment.status) break
      if (action.status === "published") {
        if (assignment.status !== "draft") throw new Error("請先還原為草稿。")
        const issues = publishIssues(
          assignment,
          data.assignments,
          data.problems,
          data.testCases,
          data.assignmentProblems,
        )
        if (issues.length) throw new Error(issues.map((issue) => issue.message).join("\n"))
      }
      if (
        action.status === "published" ||
        (action.status === "archived" && assignment.status === "draft")
      ) {
        own.forEach((relation) => {
          const problem = data.problems.find((item) => item.id === relation.problemId)!
          if (!problem) throw new Error("題庫題目不存在，無法固定作業內容。")
          relation.publishedSnapshot = {
            capturedAt: now,
            problem: structuredClone(problem),
            testCases: structuredClone(
              data.testCases.filter((item) => item.problemId === problem.id),
            ),
            specialRules: structuredClone(
              data.specialRules.filter((item) => problem.specialRuleIds.includes(item.id)),
            ),
          }
        })
      } else if (action.status === "draft")
        own.forEach((relation) => {
          delete relation.publishedSnapshot
        })
      assignment.status = action.status
      assignment.updatedAt = now
      break
    }
    case "copy-assignment": {
      const original = findAssignment(action.id)
      let code = `${original.code}-COPY`
      let suffix = 2
      while (data.assignments.some((item) => item.code.toLowerCase() === code.toLowerCase()))
        code = `${original.code}-COPY${suffix++}`
      id = createUuid()
      data.assignments.push({
        ...original,
        id,
        code,
        title: `${original.title}（副本）`,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      })
      data.assignmentProblems
        .filter((item) => item.assignmentId === original.id)
        .forEach((item) =>
          data.assignmentProblems.push({
            id: createUuid(),
            assignmentId: id,
            problemId: item.problemId,
            order: item.order,
            points: item.points,
          }),
        )
      break
    }
    case "delete-assignment":
      findAssignment(action.id)
      data.assignments = data.assignments.filter((item) => item.id !== action.id)
      data.assignmentProblems = data.assignmentProblems.filter(
        (item) => item.assignmentId !== action.id,
      )
      break
    case "add-problems": {
      editable(action.assignmentId)
      const unique = [...new Set(action.problemIds)]
      if (unique.some((problemId) => !data.problems.some((item) => item.id === problemId)))
        throw new Error("選取的題目不存在，請重新選擇。")
      unique.forEach((problemId) => {
        if (
          data.assignmentProblems.some(
            (item) => item.assignmentId === action.assignmentId && item.problemId === problemId,
          )
        )
          return
        const problem = data.problems.find((item) => item.id === problemId)!
        id = createUuid()
        data.assignmentProblems.push({
          id,
          assignmentId: action.assignmentId,
          problemId,
          points: problem.points,
          order: data.assignmentProblems.filter((item) => item.assignmentId === action.assignmentId)
            .length,
        })
      })
      break
    }
    default: {
      const relation = data.assignmentProblems.find((item) => item.id === action.id)
      if (!relation) throw new Error("找不到作業題目關聯。")
      editable(relation.assignmentId)
      if (action.type === "set-problem-points") {
        if (!Number.isFinite(action.points) || action.points <= 0)
          throw new Error("作業內配分必須大於 0。")
        relation.points = action.points
      } else if (action.type === "remove-assignment-problem") {
        data.assignmentProblems = data.assignmentProblems.filter((item) => item.id !== relation.id)
        data.assignmentProblems
          .filter((item) => item.assignmentId === relation.assignmentId)
          .sort((a, b) => a.order - b.order)
          .forEach((item, index) => {
            item.order = index
          })
      } else {
        const own = data.assignmentProblems
          .filter((item) => item.assignmentId === relation.assignmentId)
          .sort((a, b) => a.order - b.order)
        const position = own.findIndex((item) => item.id === relation.id)
        const next = position + action.delta
        if (next >= 0 && next < own.length) {
          ;[own[position], own[next]] = [own[next], own[position]]
          own.forEach((item, index) => {
            item.order = index
          })
        }
      }
    }
  }
  return { data, id }
}
