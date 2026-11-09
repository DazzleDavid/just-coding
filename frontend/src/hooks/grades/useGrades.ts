import { createContext, useContext, useMemo } from "react"
import type { GradeData, GradeInput, GradeDemoWorkspace } from "../../types/grade"
import { useManagementStore } from "../useManagementStore"
import { useStudents } from "../../components/students/StudentStore"
import { buildGradeBook } from "../../utils/grades/gradeCalculation"

export type GradeStore = {
  data: GradeData
  workspace?: GradeDemoWorkspace
  error: string
  demoError: string
  demo: boolean
  now: number
  enableDemo: () => void
  exitDemo: () => void
}
export const GradeContext = createContext<GradeStore | null>(null)

export function useGrades() {
  const store = useContext(GradeContext)
  if (!store) throw new Error("GradeProvider is required")
  const management = useManagementStore()
  const { students } = useStudents()
  const input: GradeInput = useMemo(
    () => ({
      students: store.workspace?.students ?? students,
      assignments: (store.workspace?.management ?? management.data).assignments,
      assignmentProblems: (store.workspace?.management ?? management.data).assignmentProblems,
      problems: (store.workspace?.management ?? management.data).problems,
      gradeData: store.data,
      now: store.now,
    }),
    [students, management.data, store.data, store.now, store.workspace],
  )
  const book = useMemo(() => buildGradeBook(input), [input])
  return {
    ...store,
    error: store.error || (store.workspace ? "" : management.loadError),
    input,
    book,
  }
}
