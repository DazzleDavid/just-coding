import { createContext, useContext } from "react"
import type { AssignmentData } from "../services/shared/managementStorage"
import type { AssignmentAction } from "../utils/assignments/assignmentOperations"

export type ManagementStore = {
  data: AssignmentData
  loadError: string
  execute: (action: AssignmentAction, message?: string) => string
}
export const ManagementContext = createContext<ManagementStore | null>(null)
export function useManagementStore() {
  const value = useContext(ManagementContext)
  if (!value) throw new Error("ManagementProvider is required")
  return value
}
