import { useStudentSort } from "../lib/useStudentSort"
import { useState } from "react"
import { Link } from "react-router"
import { MoreHorizontal, Plus, Search, Upload, Users } from "lucide-react"
import { useStudents } from "../components/students/StudentStore"
import { StudentColumnHeader, PageSizeSelect, cellClass, fieldClass, primaryButton, secondaryButton, StatusDialog, StudentFormDialog, StudentStats, StudentStatusBadge } from "../components/students/StudentUI"
import type { Student } from "../lib/students"

export function Students() {
  const { students } = useStudents()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [className, setClassName] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [form, setForm] = useState<Student | "new" | null>(null)
  const [confirm, setConfirm] = useState<Student | null>(null)
  const query = search.trim().toLowerCase()
  const filtered = students.filter((student) => [student.studentNumber, student.name, student.email].some((value) => value.toLowerCase().includes(query)) && (status === "all" || student.active === (status === "active")) && (!className || student.className === className))
  const sorting = useStudentSort(filtered, (student) => student)
  const rowsPerPage = pageSize || Math.max(1, filtered.length)
  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const currentPage = Math.min(page, pageCount)
  const visible = sorting.sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  function clearFilters() { setSearch(""); setStatus("all"); setClassName(""); setPage(1) }
  return <div className="space-y-6 p-6 sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-xs font-semibold tracking-widest text-primary">STUDENT DIRECTORY</p><h1 className="text-2xl font-bold">學生管理</h1><p className="mt-2 text-sm text-muted-foreground">管理學生資料、登入帳號與課程成員。</p></div><div className="flex flex-wrap gap-3"><Link to="/students/import" className={secondaryButton}><Upload size={17} />Excel 匯入</Link><button onClick={() => setForm("new")} className={primaryButton}><Plus size={17} />新增學生</button></div></div>
    <StudentStats students={students} />
    <section aria-label="學生資料管理" className="min-w-0 rounded-xl border border-border bg-card">
      <div className="flex flex-wrap gap-3 border-b border-border p-4 sm:p-5">
        <div className="relative min-w-0 flex-[2] basis-64"><Search size={17} className="absolute top-3.5 left-3 text-muted-foreground" /><input aria-label="搜尋學號、姓名、Email" placeholder="搜尋學號、姓名、Email" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className={`${fieldClass} pl-10`} /></div>
        <select aria-label="帳號狀態篩選" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className={`${fieldClass} flex-1 basis-32`}><option value="all">全部狀態</option><option value="active">啟用</option><option value="inactive">停用</option></select>
        <select aria-label="班級篩選" value={className} onChange={(event) => { setClassName(event.target.value); setPage(1) }} className={`${fieldClass} flex-1 basis-32`}><option value="">全部班級</option>{[...new Set(students.map((student) => student.className).filter(Boolean))].sort().map((name) => <option key={name}>{name}</option>)}</select>
        <button className={secondaryButton} onClick={clearFilters}>清除篩選</button>
      </div>
      <p className="px-5 py-3 text-xs text-muted-foreground">符合條件 {filtered.length} 人 · 啟用 {filtered.filter((student) => student.active).length} 人 · 停用 {filtered.filter((student) => !student.active).length} 人</p>
      <div className="overflow-x-auto"><table className="w-full min-w-[1100px] table-fixed border-collapse"><colgroup><col className="w-[6%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[12%]" /><col className="w-[20%]" /><col className="w-[20%]" /></colgroup><thead className="border-y border-border bg-muted/50 text-muted-foreground"><tr>{["序號", "學號", "姓名", "班級", "帳號狀態", "備註", "操作"].map((title) => <StudentColumnHeader key={title} title={title} sortKey={sorting.key} direction={sorting.direction} onSort={(key) => { sorting.toggle(key); setPage(1) }} />)}</tr></thead><tbody>{visible.map((student, index) => <tr key={student.id} className="border-b border-border hover:bg-accent/30">
        <td className={`${cellClass} tabular-nums text-muted-foreground`}>{(currentPage - 1) * rowsPerPage + index + 1}</td><td className={`${cellClass} font-mono`}>{student.studentNumber}</td><td className={`${cellClass} font-medium`}>{student.name}</td><td className={cellClass}>{student.className || "—"}</td><td className={cellClass}><StudentStatusBadge active={student.active} /></td><td className={cellClass}><span className="block truncate" title={student.notes || undefined}>{student.notes || "—"}</span></td>
        <td className={cellClass}><div className="flex items-center gap-2"><Link className="inline-flex min-h-11 items-center rounded px-2 text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring" to={`/students/${student.id}`}>查看詳細資料</Link><details className="relative"><summary aria-label={`${student.name}的更多操作`} className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-border hover:bg-accent"><MoreHorizontal size={18} /></summary><div className="absolute right-0 z-10 w-40 rounded-lg border border-border bg-card p-1 shadow-lg"><button className="min-h-11 w-full rounded px-3 text-left hover:bg-accent" onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); setForm(student) }}>編輯資料</button><button className={`min-h-11 w-full rounded px-3 text-left ${student.active ? "text-red-700 hover:bg-red-500/10 dark:text-red-400" : "text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"}`} onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); setConfirm(student) }}>{student.active ? "停用帳號" : "啟用帳號"}</button></div></details></div></td>
      </tr>)}</tbody></table></div>
      {!visible.length && <div className="p-12 text-center"><Users className="mx-auto mb-4 text-muted-foreground" size={32} /><h2 className="font-semibold">{students.length ? "找不到符合條件的學生" : "尚無學生資料"}</h2><p className="mt-2 text-sm text-muted-foreground">{students.length ? "試試其他關鍵字，或清除篩選條件。" : "新增學生或透過 Excel 匯入名單。"}</p></div>}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm"><p className="text-muted-foreground">第 {currentPage} / {pageCount} 頁</p><div className="flex flex-wrap items-center gap-2"><PageSizeSelect value={pageSize} onChange={(value) => { setPageSize(value); setPage(1) }} /><button className={secondaryButton} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>上一頁</button><button className={secondaryButton} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>下一頁</button></div></div>
    </section>
    {form && <StudentFormDialog student={form === "new" ? undefined : form} onClose={() => setForm(null)} onSaved={() => { clearFilters() }} />}
    {confirm && <StatusDialog student={confirm} onClose={() => setConfirm(null)} />}
  </div>
}
