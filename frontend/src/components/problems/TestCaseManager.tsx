import { useState } from "react"
import { ArrowDown, ArrowUp, Plus } from "lucide-react"
import type { Problem } from "../../types/problem"
import type { TestCase } from "../../types/testCase"
import type { ProblemAction } from "../../utils/problems/problemOperations"
import { TestCaseEditor } from "./TestCaseEditor"
import { ConfirmDialog } from "../shared/ConfirmDialog"
import { EmptyState } from "../shared/EmptyState"
import { Pagination } from "../shared/Pagination"
import { button, dangerButton, input, outlineButton, successButton } from "../ui/styles"

export function TestCaseManager({ problem, cases, onAction, onChange }: { problem: Problem; cases: TestCase[]; onAction: (action: ProblemAction) => void; onChange: (cases: TestCase[]) => void }) {
  const [filter, setFilter] = useState("")
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [deleting, setDeleting] = useState<TestCase | null>(null)
  const [error, setError] = useState("")
  const filtered = cases.filter((item) => !filter || item.visibility === filter)
  const perPage = size || Math.max(1, filtered.length)
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / perPage)))
  function run(action: ProblemAction) {
    try { onAction(action); setDeleting(null); setError(""); return true }
    catch (error) { setError(error instanceof Error ? error.message : "操作失敗。"); return false }
  }
  function add() {
    const added = run({ type: "save-testcase", problemId: problem.id, draft: { name: `測資 ${cases.length + 1}`, input: "", expectedOutput: "", visibility: filter === "hidden" ? "hidden" : "public", enabled: true } })
    if (added) setPage(size ? Math.ceil((filtered.length + 1) / size) : 1)
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">測資管理</h2><button type="button" className={button} onClick={add}><Plus size={16} />新增測資</button></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["總測資", cases.length], ["公開測資", cases.filter((item) => item.visibility === "public").length], ["隱藏測資", cases.filter((item) => item.visibility === "hidden").length], ["已啟用", cases.filter((item) => item.enabled).length]].map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-card px-4 py-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>)}</div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <label className="flex flex-wrap items-center gap-3 text-sm"><span className="shrink-0">測資類型</span><select className={`${input} w-auto! min-w-32 sm:max-w-48`} value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1) }}><option value="">全部</option><option value="public">公開</option><option value="hidden">隱藏</option></select></label>
    <div className="space-y-4">
      {filtered.slice((current - 1) * perPage, current * perPage).map((item) => {
        const position = cases.findIndex((testCase) => testCase.id === item.id)
        return <TestCaseEditor key={item.id} testCase={item} onChange={(value) => onChange(cases.map((testCase) => testCase.id === item.id ? value : testCase))}>
          <button type="button" className={outlineButton} onClick={() => run({ type: "copy-testcase", id: item.id })}>複製</button>
          <button type="button" className={item.enabled ? dangerButton : successButton} onClick={() => run({ type: "toggle-testcase", id: item.id })}>{item.enabled ? "停用" : "啟用"}</button>
          <button type="button" className={outlineButton} aria-label={`上移${item.name}`} disabled={position === 0} onClick={() => run({ type: "move-testcase", id: item.id, delta: -1 })}><ArrowUp size={16} /></button>
          <button type="button" className={outlineButton} aria-label={`下移${item.name}`} disabled={position === cases.length - 1} onClick={() => run({ type: "move-testcase", id: item.id, delta: 1 })}><ArrowDown size={16} /></button>
          <button type="button" className={dangerButton} onClick={() => setDeleting(item)}>刪除</button>
        </TestCaseEditor>
      })}
      {!filtered.length && <EmptyState title={cases.length ? "沒有符合條件的測資" : "尚未新增測資"} />}
    </div>
    <Pagination total={filtered.length} page={current} size={size} onPage={setPage} onSize={(value) => { setSize(value); setPage(1) }} />
    {deleting && <ConfirmDialog title="刪除測資" danger onCancel={() => setDeleting(null)} onConfirm={() => run({ type: "delete-testcase", id: deleting.id })}>確定刪除「{deleting.name}」？儲存此分頁後才會正式移除。{error && <p className="text-destructive">{error}</p>}</ConfirmDialog>}
  </div>
}
