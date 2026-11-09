import { useStudentSort } from "../lib/useStudentSort"
import { useRef, useState } from "react"
import { Link } from "react-router"
import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, Upload, X } from "lucide-react"
import { useStudents } from "../components/students/StudentStore"
import {
  StudentColumnHeader,
  PageSizeSelect,
  cellClass,
  primaryButton,
  secondaryButton,
} from "../components/students/StudentUI"
import {
  downloadImportReport,
  downloadStudentTemplate,
  importStatus,
  readStudentWorkbook,
  validateImport,
  type ImportResult,
  type ImportRow,
} from "../lib/studentImport"

export function StudentImport() {
  const { students, addStudents } = useStudents()
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [completed, setCompleted] = useState<ImportResult[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [onlyErrors, setOnlyErrors] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dragging, setDragging] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const results = step === 4 ? completed : validateImport(rows, students)
  const valid = results.filter((row) => row.status === "valid").length
  const duplicate = results.filter((row) => row.status === "duplicate").length
  const invalid = results.filter((row) => row.status === "error").length
  const filtered = results.filter((row) => step !== 2 || !onlyErrors || row.status === "error")
  const sorting = useStudentSort(filtered, (row) => row.draft)
  const rowsPerPage = pageSize || Math.max(1, filtered.length)
  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const currentPage = Math.min(page, pageCount)
  const visible = sorting.sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  function choose(next?: File) {
    setError("")
    setRows([])
    setFile(null)
    setPage(1)
    if (!next) return
    if (!next.name.toLowerCase().endsWith(".xlsx")) {
      setError("僅支援 .xlsx 格式。")
      return
    }
    if (next.size > 5 * 1024 * 1024) {
      setError("檔案不可超過 5 MB。")
      return
    }
    setFile(next)
  }
  async function parse() {
    if (!file || busy) return
    setBusy(true)
    setError("")
    try {
      setRows(await readStudentWorkbook(await file.arrayBuffer()))
      setOnlyErrors(false)
      setStep(2)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "無法解析檔案，請確認檔案未損壞。")
    } finally {
      setBusy(false)
    }
  }
  async function download(action: () => Promise<void>) {
    setBusy(true)
    setError("")
    try {
      await action()
    } catch {
      setError("下載失敗，請稍後再試。")
    } finally {
      setBusy(false)
    }
  }
  function confirmImport() {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      const latest = validateImport(rows, students)
      addStudents(latest.filter((row) => row.status === "valid").map((row) => row.draft))
      setCompleted(latest)
      setStep(4)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "匯入失敗，請重新驗證。")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <ol
        aria-label="匯入進度"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {["上傳 Excel", "驗證資料", "預覽確認", "匯入完成"].map((title, index) => (
          <li
            key={title}
            aria-current={step === index + 1 ? "step" : undefined}
            className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${step === index + 1 ? "border-primary bg-accent text-primary" : "border-border bg-card text-muted-foreground"}`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current font-mono text-xs">
              {step > index + 1 ? <CheckCircle2 size={16} /> : index + 1}
            </span>
            {title}
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">
        目前僅儲存於此瀏覽器的模擬資料，不會建立真正的登入帳號。
      </p>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <section
        aria-busy={busy}
        className="space-y-6 rounded-xl border border-border bg-card p-5 sm:p-8"
      >
        {step === 1 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">上傳學生名單</h2>
              <button
                disabled={busy}
                className={secondaryButton}
                onClick={() => download(downloadStudentTemplate)}
              >
                <Download size={17} />
                下載 Excel 範本
              </button>
            </div>
            <div
              onDragOver={(event) => {
                event.preventDefault()
                if (!busy) setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                if (busy) return
                if (event.dataTransfer.files.length !== 1) {
                  setError("請一次上傳一個檔案。")
                  return
                }
                choose(event.dataTransfer.files[0])
              }}
              className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${dragging ? "border-primary bg-accent" : "border-border bg-background"}`}
            >
              <Upload
                size={32}
                className="mx-auto mb-4 text-primary"
              />
              <p className="font-medium">將 Excel 檔案拖曳至此</p>
              <p className="mt-2 text-sm text-muted-foreground">
                .xlsx · 最大 5 MB · 最多 1,000 筆
              </p>
              <button
                disabled={busy}
                className={`${secondaryButton} mt-5`}
                onClick={() => input.current?.click()}
              >
                選擇檔案
              </button>
              <input
                ref={input}
                type="file"
                accept=".xlsx"
                aria-label="選擇 Excel 檔案"
                className="sr-only"
                tabIndex={-1}
                onChange={(event) => {
                  choose(event.target.files?.[0])
                  event.target.value = ""
                }}
              />
            </div>
            {file && (
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <FileSpreadsheet
                  size={22}
                  className="shrink-0 text-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  disabled={busy}
                  className={secondaryButton}
                  aria-label="移除檔案"
                  onClick={() => choose()}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <p className="text-sm leading-7 text-muted-foreground">
              僅讀取第一個工作表的班級、姓名、學號，其他欄位與工作表不會匯入。第一列須包含這三個欄位標題，學號與姓名必填。請將學號保留為文字，以免遺失前導零。
            </p>
            <div className="flex flex-wrap justify-between gap-3">
              <Link
                to="/students"
                className={secondaryButton}
              >
                <ArrowLeft size={16} />
                返回學生管理
              </Link>
              <button
                disabled={!file || busy}
                onClick={parse}
                className={primaryButton}
              >
                {busy ? "處理中…" : "下一步：驗證資料"}
              </button>
            </div>
          </>
        )}
        {(step === 2 || step === 3) && (
          <>
            <h2 className="text-lg font-semibold">
              {step === 2 ? "資料驗證結果" : "確認匯入內容"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["有效資料", valid],
                ["重複資料", duplicate],
                ["錯誤資料", invalid],
              ].map(([label, count]) => (
                <div
                  key={label}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{count}</p>
                </div>
              ))}
            </div>
            {step === 2 ? (
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={onlyErrors}
                  onChange={(event) => {
                    setOnlyErrors(event.target.checked)
                    setPage(1)
                  }}
                />
                只查看錯誤資料
              </label>
            ) : (
              <div className="rounded-lg bg-accent p-4 text-sm leading-7">
                共 {results.length} 筆 · 預計新增 <strong>{valid}</strong> 筆 · 略過 {duplicate} 筆
                · 錯誤 {invalid} 筆。
                <br />
                僅新增有效資料；重複且一致的資料會略過，衝突或格式錯誤不匯入，也不覆蓋既有資料。
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[1100px] table-fixed border-collapse">
                <colgroup>
                  <col className="w-[6%]" />
                  <col className="w-[10%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[17%]" />
                  <col className="w-[25%]" />
                </colgroup>
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    {["序號", "Excel 列號", "班級", "姓名", "學號", "驗證狀態", "原因"].map(
                      (label) => (
                        <StudentColumnHeader
                          key={label}
                          title={label}
                          sortKey={sorting.key}
                          direction={sorting.direction}
                          onSort={(key) => {
                            sorting.toggle(key)
                            setPage(1)
                          }}
                        />
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row, index) => (
                    <tr
                      key={row.row}
                      className="border-t border-border"
                    >
                      <td className={`${cellClass} tabular-nums text-muted-foreground`}>
                        {(currentPage - 1) * rowsPerPage + index + 1}
                      </td>
                      <td className={cellClass}>{row.row}</td>
                      <td className={cellClass}>{row.draft.className || "—"}</td>
                      <td className={cellClass}>{row.draft.name || "—"}</td>
                      <td className={`${cellClass} font-mono`}>{row.draft.studentNumber || "—"}</td>
                      <td
                        className={`${cellClass} ${row.status === "error" ? "text-destructive" : row.status === "valid" ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {importStatus[row.status]}
                      </td>
                      <td className={cellClass}>
                        {row.reasons.length
                          ? row.reasons.map((reason) => (
                              <p key={reason}>
                                第 {row.row} 列：{reason}
                              </p>
                            ))
                          : "驗證通過"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {onlyErrors && step === 2 && !invalid && (
                <p className="p-8 text-center text-sm text-muted-foreground">沒有錯誤資料。</p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">
                共 {filtered.length} 筆 · 第 {currentPage} / {pageCount} 頁
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <PageSizeSelect
                  value={pageSize}
                  onChange={(value) => {
                    setPageSize(value)
                    setPage(1)
                  }}
                />
                <button
                  type="button"
                  disabled={busy || currentPage === 1}
                  className={secondaryButton}
                  onClick={() => setPage(currentPage - 1)}
                >
                  上一頁
                </button>
                <button
                  type="button"
                  disabled={busy || currentPage === pageCount}
                  className={secondaryButton}
                  onClick={() => setPage(currentPage + 1)}
                >
                  下一頁
                </button>
              </div>
            </div>
            <div className="flex flex-wrap justify-between gap-3">
              <button
                disabled={busy}
                className={secondaryButton}
                onClick={() => {
                  setError("")
                  setPage(1)
                  setStep(step - 1)
                }}
              >
                上一步
              </button>
              {step === 2 ? (
                <button
                  disabled={busy}
                  className={primaryButton}
                  onClick={() => {
                    setOnlyErrors(false)
                    setPage(1)
                    setStep(3)
                  }}
                >
                  下一步：預覽確認
                </button>
              ) : (
                <button
                  disabled={busy || valid === 0}
                  onClick={confirmImport}
                  className={primaryButton}
                >
                  {busy ? "匯入中…" : `確認匯入 ${valid} 筆學生`}
                </button>
              )}
            </div>
            {step === 3 && valid === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  沒有可新增的資料。請返回修正檔案，或完成此次檢查並下載結果。
                </p>
                <button
                  className={secondaryButton}
                  disabled={busy}
                  onClick={() => {
                    setCompleted(results)
                    setStep(4)
                  }}
                >
                  完成檢查（新增 0 筆）
                </button>
              </div>
            )}
          </>
        )}
        {step === 4 && (
          <div className="space-y-6 text-center">
            <CheckCircle2
              size={48}
              className="mx-auto text-primary"
            />
            <div>
              <h2 className="text-xl font-semibold">匯入處理完成</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                學生資料已同步更新至本機學生列表。
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["新增成功", valid],
                ["略過", duplicate],
                ["未匯入", invalid],
              ].map(([label, count]) => (
                <div
                  className="rounded-lg border border-border p-5"
                  key={label}
                >
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-3xl font-semibold">{count}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                className={primaryButton}
                to="/students"
              >
                返回學生管理
              </Link>
              <button
                disabled={busy}
                className={secondaryButton}
                onClick={() => {
                  setStep(1)
                  setFile(null)
                  setRows([])
                  setCompleted([])
                  setError("")
                  setOnlyErrors(false)
                }}
              >
                再次匯入
              </button>
              <button
                disabled={busy}
                className={secondaryButton}
                onClick={() => download(() => downloadImportReport(completed))}
              >
                <Download size={16} />
                {busy ? "下載中…" : "下載結果報告"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
