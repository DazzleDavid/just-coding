import { useState } from "react"
import { useGrades } from "../../hooks/grades/useGrades"
import { outlineButton } from "../ui/styles"

export function GradeDataNotice() {
  const grades = useGrades()
  const [error, setError] = useState("")
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>
          {grades.demo
            ? "測試資料模式：學生、作業及提交評測均為虛構，不會寫入正式資料。"
            : "依學生資料、有效提交與目前指定的評測結果統計。"}
        </p>
        <div className="flex flex-wrap gap-2">
          {grades.demo && (
            <button
              type="button"
              className={`${outlineButton} min-h-9! text-xs!`}
              onClick={() => {
                setError("")
                try {
                  grades.enableDemo()
                } catch (error) {
                  setError(error instanceof Error ? error.message : "無法重建測試資料。")
                }
              }}
            >
              重建測試資料
            </button>
          )}
          <button
            type="button"
            className={`${outlineButton} min-h-9! text-xs!`}
            onClick={() => {
              setError("")
              try {
                if (grades.demo || grades.demoError) grades.exitDemo()
                else grades.enableDemo()
              } catch (error) {
                setError(error instanceof Error ? error.message : "無法載入示範資料。")
              }
            }}
          >
            {grades.demo || grades.demoError ? "返回正式資料" : "載入測試資料"}
          </button>
        </div>
      </div>
      {(grades.error || grades.demoError || error) && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {grades.error || grades.demoError || error}
        </p>
      )}
    </>
  )
}
