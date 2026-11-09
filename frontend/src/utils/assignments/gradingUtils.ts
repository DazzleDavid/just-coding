import type { Assignment } from "../../types/assignment"

export function problemLabel(order: number): string {
  let value = order + 1
  let label = ""
  while (value > 0) {
    value--
    label = String.fromCharCode(65 + value % 26) + label
    value = Math.floor(value / 26)
  }
  return label
}

export function assignmentDisplayStatus(assignment: Assignment, now = Date.now()) {
  if (assignment.status === "draft") return "草稿"
  if (assignment.status === "archived") return "已封存"
  if (now < Date.parse(assignment.startAt)) return "尚未開放"
  return now >= Date.parse(assignment.dueAt) ? "已截止" : "進行中"
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", dateStyle: "short", timeStyle: "short" })
}

export function localDateInput(value: string) {
  if (!value) return ""
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}
