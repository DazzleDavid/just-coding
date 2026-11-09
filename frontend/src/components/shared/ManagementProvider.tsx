import { useEffect, useRef, useState, type ReactNode } from "react"
import { ManagementContext } from "../../hooks/useManagementStore"
import {
  emptyAssignmentData,
  loadAssignmentData,
  saveAssignmentData,
} from "../../services/shared/managementStorage"
import {
  applyAssignmentAction,
  type AssignmentAction,
} from "../../utils/assignments/assignmentOperations"

export function ManagementProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try {
      return { data: loadAssignmentData(), error: "" }
    } catch (error) {
      return {
        data: emptyAssignmentData(),
        error: error instanceof Error ? error.message : "無法讀取管理資料，已停止寫入。",
      }
    }
  })
  const [data, setData] = useState(initial.data)
  const current = useRef(data)
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null)
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4500)
    return () => window.clearTimeout(timer)
  }, [toast])
  function execute(action: AssignmentAction, message = "已儲存變更。") {
    if (initial.error) throw new Error(initial.error)
    const result = applyAssignmentAction(current.current, action)
    saveAssignmentData(result.data)
    current.current = result.data
    setData(result.data)
    setToast({ message, id: Date.now() })
    return result.id
  }
  return (
    <ManagementContext.Provider value={{ data, loadError: initial.error, execute }}>
      {children}
      {toast && (
        <div
          role="status"
          className="fixed right-4 bottom-4 z-50 flex max-w-[calc(100%-2rem)] items-center gap-4 rounded-xl border border-border bg-card p-4 text-sm text-foreground shadow-lg"
        >
          <span>{toast.message}</span>
          <button
            type="button"
            aria-label="關閉通知"
            className="min-h-10 rounded px-2 focus-visible:outline-2 focus-visible:outline-ring"
            onClick={() => setToast(null)}
          >
            關閉
          </button>
        </div>
      )}
    </ManagementContext.Provider>
  )
}
