import { useEffect, useState, type ReactNode } from "react"
import { GradeContext } from "../../hooks/grades/useGrades"
import {
  emptyGradeData,
  loadGradeData,
  loadDemoGradeData,
  saveDemoGradeData,
} from "../../services/grades/gradeService"
import { createSubmissionDemoWorkspace } from "../../data/grades/mockSubmissionWorkspace"
import type { GradeDemoData } from "../../types/grade"

export function GradeProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try {
      return { data: loadGradeData(), error: "" }
    } catch (error) {
      return {
        data: emptyGradeData(),
        error: error instanceof Error ? error.message : "成績資料讀取失敗。",
      }
    }
  })
  const [initialDemo] = useState(() => {
    try {
      return { data: loadDemoGradeData(), error: "" }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : "示範資料讀取失敗。" }
    }
  })
  const [demoData, setDemoData] = useState<GradeDemoData | null>(initialDemo.data)
  const [demoError, setDemoError] = useState(initialDemo.error)
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(timer)
  }, [])
  function enableDemo() {
    const next = createSubmissionDemoWorkspace()
    saveDemoGradeData(next)
    setDemoData(next)
    setDemoError("")
  }
  function exitDemo() {
    saveDemoGradeData(null)
    setDemoData(null)
    setDemoError("")
  }
  return (
    <GradeContext.Provider
      value={{
        data: demoData ?? initial.data,
        workspace: demoData?.workspace,
        error: demoData ? "" : initial.error,
        demoError,
        demo: demoData !== null,
        now,
        enableDemo,
        exitDemo,
      }}
    >
      {children}
    </GradeContext.Provider>
  )
}
