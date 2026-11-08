import { createContext, useContext } from "react"
import type { Student, StudentDraft } from "../../lib/students"

export type StudentStore = {
  students: Student[]
  saveStudent: (draft: StudentDraft, id?: string) => void
  setActive: (id: string, active: boolean) => void
  addStudents: (drafts: StudentDraft[]) => void
}

export const StudentContext = createContext<StudentStore | null>(null)
export function useStudents() {
  const store = useContext(StudentContext)
  if (!store) throw new Error("StudentProvider is required")
  return store
}
