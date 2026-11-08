import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { ArrowDown, ArrowUp, ArrowUpDown, Plus } from "lucide-react"
import { useProblems } from "../../hooks/problems/useProblems"
import { problemIssues } from "../../utils/problems/problemValidation"
import { StatusBadge } from "../../components/shared/StatusBadge"
import { EmptyState } from "../../components/shared/EmptyState"
import { ConfirmDialog, FormDialog } from "../../components/shared/ConfirmDialog"
import { Pagination } from "../../components/shared/Pagination"
import { button, card, dangerButton, input, outlineButton, tableCell } from "../../components/ui/styles"

const difficulties = { easy: "簡單", medium: "中等", hard: "困難" }

export function ProblemsPage() {
  const { data, execute, loadError } = useProblems()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [tag, setTag] = useState("")
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [sortDirection, setSortDirection] = useState<"ascending" | "descending" | null>(null)
  const filtered = data.problems.filter((item) => `${item.code} ${item.title}`.toLowerCase().includes(query.trim().toLowerCase()) && (!difficulty || item.difficulty === difficulty) && (!tag || item.tags.includes(tag)))
  const sorted = sortDirection ? [...filtered].sort((left, right) => left.code.localeCompare(right.code, "zh-Hant", { numeric: true, sensitivity: "base" }) * (sortDirection === "ascending" ? 1 : -1)) : filtered
  const SortIcon = sortDirection === "ascending" ? ArrowUp : sortDirection === "descending" ? ArrowDown : ArrowUpDown
  const nextSortLabel = sortDirection === "ascending" ? "遞減" : sortDirection === "descending" ? "未設定" : "遞增"
  const perPage = size || Math.max(1, filtered.length)
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / perPage)))
  const own = sorted.slice((current - 1) * perPage, current * perPage)
  const references = data.assignmentProblems.filter((item) => item.problemId === deleting)
  function copy(id: string) {
    try { const copied = execute({ type: "copy-problem", id }, "題目及測資已複製到題庫。"); navigate(`/problems/${copied}/edit`) }
    catch (error) { setError(error instanceof Error ? error.message : "複製失敗。") }
  }
  function remove() {
    if (!deleting) return
    try { execute({ type: "delete-problem", id: deleting }, "題目已刪除。"); setDeleting(null); setError("") }
    catch (error) { setError(error instanceof Error ? error.message : "刪除失敗。") }
  }
  return <div className="space-y-6 p-6 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">題目管理</h1><p className="mt-2 text-sm text-muted-foreground">獨立管理題庫、評分規則與測資，供不同作業重複引用。</p></div><Link to="/problems/new" className={button}><Plus size={17} />新增題目</Link></div>
    {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-3">{[["題庫總數", data.problems.length], ["完整題目", data.problems.filter((item) => !problemIssues(item, data.testCases).length).length], ["已被作業引用", data.problems.filter((item) => data.assignmentProblems.some((relation) => relation.problemId === item.id)).length]].map(([label, count]) => <div key={label} className={card}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-semibold">{count}</p></div>)}</div>
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap gap-3 p-5">
        <input aria-label="搜尋題目名稱或編號" placeholder="搜尋題目名稱或編號" className={`${input} min-w-0 flex-[2] basis-64`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
        <select aria-label="難度篩選" className={`${input} flex-1 basis-32`} value={difficulty} onChange={(event) => { setDifficulty(event.target.value); setPage(1) }}><option value="">全部難度</option>{Object.entries(difficulties).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
        <select aria-label="標籤篩選" className={`${input} flex-1 basis-32`} value={tag} onChange={(event) => { setTag(event.target.value); setPage(1) }}><option value="">全部標籤</option>{[...new Set(data.problems.flatMap((item) => item.tags))].sort().map((label) => <option key={label}>{label}</option>)}</select>
        <button className={outlineButton} onClick={() => { setQuery(""); setDifficulty(""); setTag(""); setPage(1) }}>清除篩選</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] table-fixed border-collapse">
          <colgroup>{[7, 11, 17, 13, 10, 10, 8, 24].map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
          <thead className="bg-muted/50 text-muted-foreground"><tr>
            <th scope="col" className={tableCell}>序號</th>
            <th scope="col" className={tableCell} aria-sort={sortDirection ?? "none"}><button type="button" aria-label={`編號：切換為${nextSortLabel}排序`} title={`切換為${nextSortLabel}排序`} className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded focus-visible:outline-2 focus-visible:outline-ring" onClick={() => { setSortDirection(sortDirection === null ? "ascending" : sortDirection === "ascending" ? "descending" : null); setPage(1) }}>編號<SortIcon size={15} className={sortDirection ? "text-primary" : "text-muted-foreground"} /></button></th>
            {["名稱", "使用語言", "測資數目", "完整性", "引用數", "操作"].map((label) => <th key={label} scope="col" className={tableCell}>{label}</th>)}
          </tr></thead>
          <tbody>{own.map((problem, index) => <tr key={problem.id} className="border-t border-border">
            <td className={`${tableCell} tabular-nums`}>{(current - 1) * perPage + index + 1}</td>
            <td className={`${tableCell} font-mono`}>{problem.code}</td>
            <td className={tableCell}><Link className="text-primary hover:underline" to={`/problems/${problem.id}/details`}>{problem.title}</Link></td>
            <td className={tableCell}>{problem.allowedLanguages.join("、")}</td>
            <td className={tableCell}>{data.testCases.filter((item) => item.problemId === problem.id).length}</td>
            <td className={tableCell}><StatusBadge label={problemIssues(problem, data.testCases).length ? "未完成" : "完整"} /></td>
            <td className={tableCell}>{data.assignmentProblems.filter((item) => item.problemId === problem.id).length}</td>
            <td className={tableCell}><div className="flex flex-wrap gap-2"><Link className={outlineButton} to={`/problems/${problem.id}/edit`}>編輯</Link><Link className={outlineButton} to={`/problems/${problem.id}/edit#testcases`}>測資</Link><button className={outlineButton} onClick={() => copy(problem.id)}>複製</button><button className={dangerButton} onClick={() => { setError(""); setDeleting(problem.id) }}>刪除</button></div></td>
          </tr>)}</tbody>
        </table>
      </div>
      {!filtered.length && <EmptyState title={data.problems.length ? "沒有符合條件的題目" : "題庫目前沒有題目"} description="先新增題目與測資，再到作業詳情配置題目。" />}
      <Pagination total={filtered.length} page={current} size={size} onPage={setPage} onSize={(value) => { setSize(value); setPage(1) }} />
    </section>
    {deleting && (references.length ? <FormDialog title="題目仍被作業引用，無法刪除" onClose={() => setDeleting(null)}><p className="mb-4 text-sm">請先至以下作業的題目配置移除引用；已發布作業須先取消發布。</p><ul className="space-y-3">{references.map((reference) => { const assignment = data.assignments.find((item) => item.id === reference.assignmentId)!; return <li key={reference.id}><Link to={`/assignments/${assignment.id}#problems`} className="text-sm text-primary underline">{assignment.code} · {assignment.title}</Link></li> })}</ul></FormDialog> : <ConfirmDialog title="刪除題庫題目" danger onCancel={() => setDeleting(null)} onConfirm={remove}>題目及其測資將一併刪除，無法復原。{error && <p className="text-destructive">{error}</p>}</ConfirmDialog>)}
  </div>
}
