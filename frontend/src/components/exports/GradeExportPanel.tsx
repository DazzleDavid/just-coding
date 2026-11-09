import { useMemo, useState } from "react"
import { useGrades } from "../../hooks/grades/useGrades"
import {
  gradeExportMetrics,
  gradeExportMetricLabels,
  type GradeExportMetric,
  type GradeRoster,
} from "../../types/exports"
import {
  buildBatchGradeReport,
  buildRosterGradeReport,
  downloadBatchGradeReport,
} from "../../utils/exports/gradeBatchExport"
import { readGradeRosterWorkbook } from "../../utils/exports/gradeRosterWorkbook"
import { GradeExportPreview } from "./GradeExportPreview"
import { GradeExportAssignmentPicker } from "./GradeExportAssignmentPicker"
import { button, input, outlineButton } from "../ui/styles"

export function GradeExportPanel() {
  const grades = useGrades()
  const [ids, setIds] = useState<string[]>([])
  const [metrics, setMetrics] = useState<GradeExportMetric[]>(["score"])
  const [mode, setMode] = useState<"general" | "roster">("general")
  const [roster, setRoster] = useState<GradeRoster | null>(null)
  const [filename, setFilename] = useState("")
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const preview = useMemo(() => {
    try {
      if (mode === "general")
        return { error: "", report: buildBatchGradeReport(grades.book.assignments, ids, metrics) }
      if (!roster)
        return { error: "請上傳第一張工作表含有班級、姓名、學號的 Excel 名單。", report: null }
      return {
        error: "",
        report: buildRosterGradeReport(
          grades.book.assignments,
          ids,
          metrics,
          grades.input.students,
          roster,
        ),
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "無法產生匯出預覽。", report: null }
    }
  }, [mode, roster, grades.book.assignments, grades.input.students, ids, metrics])
  const report = preview.report
  const busy = loading || exporting
  return (
    <div className="space-y-5">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="匯出方式"
      >
        {(
          [
            ["general", "一般匯出"],
            ["roster", "依 Excel 名單順序"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            className={mode === value ? button : outlineButton}
            disabled={busy}
            onClick={() => {
              setMode(value)
              setError("")
              setMessage("")
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <fieldset
        disabled={busy}
        className="space-y-3"
      >
        <legend className="mb-2 text-sm font-medium">
          匯出內容 <span className="text-destructive">*</span>
          <span className="ml-2 text-xs font-normal text-muted-foreground">可複選，至少一項</span>
        </legend>
        <div className="flex flex-wrap gap-4">
          {gradeExportMetrics.map((metric) => (
            <label
              key={metric}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={metrics.includes(metric)}
                onChange={(event) => {
                  setMetrics(
                    event.target.checked
                      ? [...metrics, metric]
                      : metrics.filter((item) => item !== metric),
                  )
                  setMessage("")
                }}
              />
              {gradeExportMetricLabels[metric]}
            </label>
          ))}
        </div>
      </fieldset>
      <GradeExportAssignmentPicker
        summaries={grades.book.assignments}
        ids={ids}
        disabled={busy}
        onChange={(value) => {
          setIds(value)
          setMessage("")
        }}
      />
      {mode === "roster" && (
        <fieldset
          disabled={busy}
          className="space-y-3 rounded-lg border border-border p-4"
        >
          <h3 className="text-sm font-medium">
            Excel 名單 <span className="text-destructive">*</span>
          </h3>
          <p className="text-xs leading-5 text-muted-foreground">
            只讀取第一張工作表的班級、姓名、學號，依原名單順序匯出這三欄與所選作業資料，其他欄位及工作表不納入。
          </p>
          <label className="block text-sm">
            <span className="sr-only">上傳匯出名單</span>
            <input
              type="file"
              accept=".xlsx"
              className={`${input} file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-foreground`}
              disabled={busy}
              onChange={async (event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (!file) return
                setRoster(null)
                setFilename("")
                setError("")
                setMessage("")
                if (!file.name.toLowerCase().endsWith(".xlsx")) {
                  setError("請選擇 .xlsx 檔案。")
                  return
                }
                if (file.size > 5 * 1024 * 1024) {
                  setError("Excel 檔案不得超過 5 MB。")
                  return
                }
                setLoading(true)
                try {
                  const result = await readGradeRosterWorkbook(await file.arrayBuffer())
                  setRoster(result)
                  setFilename(file.name)
                } catch (error) {
                  setError(error instanceof Error ? error.message : "讀取 Excel 失敗。")
                } finally {
                  setLoading(false)
                }
              }}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            {loading ? "讀取中…" : filename || ".xlsx · 最大 5 MB"}
          </p>
          {roster && (
            <p className="text-sm text-muted-foreground">
              已讀取「{roster.sheetName}」的 {roster.rows.length}{" "}
              位學生，已自動辨識班級、姓名、學號。
            </p>
          )}
        </fieldset>
      )}
      <GradeExportPreview
        key={`${mode}-${filename}`}
        report={report}
        error={preview.error}
        roster={mode === "roster"}
      />
      {(grades.error || error) && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {grades.error || error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="text-sm text-primary"
        >
          {message}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          未繳交、待評測與評測異常保留狀態文字；有效 0 分以數字匯出。
          {grades.demo && "檔名將標示測試資料。"}
        </p>
        <button
          type="button"
          className={button}
          disabled={busy || !report || !!grades.error}
          onClick={async () => {
            if (!report) return
            setExporting(true)
            setError("")
            setMessage("")
            try {
              await downloadBatchGradeReport(report, mode === "roster", grades.demo)
              setMessage("Excel 已產生，已匯出完整資料，不受預覽分頁影響。")
            } catch (error) {
              setError(error instanceof Error ? error.message : "匯出失敗。")
            } finally {
              setExporting(false)
            }
          }}
        >
          {exporting ? "產生中…" : "確認匯出 Excel"}
        </button>
      </div>
    </div>
  )
}
