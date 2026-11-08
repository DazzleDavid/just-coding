import { createContext, useContext } from "react"
import type { AssignmentData } from "../services/shared/managementStorage"
import type { ProblemAction } from "../utils/problems/problemOperations"

export type ManagementStore = {
  data: AssignmentData
  loadError: string
  execute: (action: ProblemAction, message?: string) => string
}
export const ManagementContext = createContext<ManagementStore | null>(null)
export function useManagementStore() {
  const value = useContext(ManagementContext)
  if (!value) throw new Error("ManagementProvider is required")
  return value
}
