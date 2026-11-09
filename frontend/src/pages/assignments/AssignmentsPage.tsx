import { useEffect, useState } from "react"
import { Link } from "react-router"
import { Plus } from "lucide-react"
import { useAssignments } from "../../hooks/assignments/useAssignments"
import { assignmentDisplayStatus } from "../../utils/assignments/gradingUtils"
import { AssignmentTable } from "../../components/assignments/AssignmentTable"
import { EmptyState } from "../../components/shared/EmptyState"
import { Pagination } from "../../components/shared/Pagination"
import { button, card, input, outlineButton } from "../../components/ui/styles"

export function AssignmentsPage() {
  const { data, loadError } = useAssignments()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])
  const filtered = data.assignments.filter(
    (item) =>
      `${item.code} ${item.title}`.toLowerCase().includes(search.trim().toLowerCase()) &&
      (!status || assignmentDisplayStatus(item, now) === status),
  )
  const perPage = size || Math.max(1, filtered.length)
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / perPage)))
  const counts = [
    ["作業總數", data.assignments.length],
    [
      "進行中",
      data.assignments.filter((item) => assignmentDisplayStatus(item, now) === "進行中").length,
    ],
    ["草稿", data.assignments.filter((item) => item.status === "draft").length],
    [
      "已截止",
      data.assignments.filter((item) => assignmentDisplayStatus(item, now) === "已截止").length,
    ],
  ]
  return (
    <div className="space-y-6 p-6 sm:p-8">
      {loadError && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {loadError}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {counts.map(([label, count]) => (
          <div
            key={label}
            className={card}
          >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 text-3xl font-bold">{count}</p>
          </div>
        ))}
      </div>
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap gap-3 p-5">
          <input
            aria-label="搜尋作業名稱或編號"
            placeholder="搜尋作業名稱或編號"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            className={`${input} min-w-0 flex-[2] basis-64`}
          />
          <select
            aria-label="作業狀態篩選"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
            className={`${input} flex-1 basis-36`}
          >
            <option value="">全部狀態</option>
            {["草稿", "尚未開放", "進行中", "已截止", "已封存"].map((label) => (
              <option key={label}>{label}</option>
            ))}
          </select>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`${outlineButton} whitespace-nowrap`}
              onClick={() => {
                setSearch("")
                setStatus("")
                setPage(1)
              }}
            >
              清除篩選
            </button>
            <Link
              className={`${button} whitespace-nowrap`}
              to="/assignments/new"
            >
              <Plus size={17} />
              新增作業
            </Link>
          </div>
        </div>
        <AssignmentTable
          assignments={filtered.slice((current - 1) * perPage, current * perPage)}
          offset={(current - 1) * perPage}
        />
        {!filtered.length && (
          <EmptyState
            title={data.assignments.length ? "沒有符合條件的作業" : "尚未建立作業"}
            description="新增一份作業，開始規劃題目與測資。"
          />
        )}
        <Pagination
          total={filtered.length}
          page={current}
          size={size}
          onPage={setPage}
          onSize={(value) => {
            setSize(value)
            setPage(1)
          }}
        />
      </section>
    </div>
  )
}
