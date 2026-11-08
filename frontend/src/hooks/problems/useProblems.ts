import { useManagementStore } from "../useManagementStore"

// Use the shared graph to retain references and published snapshots atomically.
export function useProblems() {
  return useManagementStore()
}
