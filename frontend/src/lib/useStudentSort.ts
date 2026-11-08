import { useState } from "react"
import type { StudentDraft } from "./students"

export type StudentSortKey = "studentNumber" | "name"
const collator = new Intl.Collator("zh-Hant", { numeric: true, sensitivity: "base" })

export function useStudentSort<T>(items: T[], getStudent: (item: T) => StudentDraft) {
  const [key, setKey] = useState<StudentSortKey | null>(null)
  const [direction, setDirection] = useState<"ascending" | "descending">("ascending")
  function toggle(next: StudentSortKey) {
    if (key === next && direction === "descending") {
      setKey(null)
      setDirection("ascending")
      return
    }
    setDirection(key === next && direction === "ascending" ? "descending" : "ascending")
    setKey(next)
  }
  const sorted = key
    ? [...items].sort((left, right) => {
        const result = collator.compare(getStudent(left)[key], getStudent(right)[key])
        return direction === "ascending" ? result : -result
      })
    : items
  return { key, direction, toggle, sorted }
}
