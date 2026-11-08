import { createContext, useContext } from "react"

export type WorkspaceContextValue = {
  theme: "light" | "dark"
  toggleTheme: () => void
  selectedCourse: string | null
  selectCourse: (course: string) => void
}
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
export function useWorkspace() {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error("Workspace context is required")
  return value
}
