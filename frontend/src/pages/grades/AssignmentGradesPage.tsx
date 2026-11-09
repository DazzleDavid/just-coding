import { useGrades } from "../../hooks/grades/useGrades"
import { useGradeFilters } from "../../hooks/grades/useGradeFilters"
import { AssignmentGradeTable } from "../../components/grades/AssignmentGradeTable"
import { GradeSelect, GradeDateFilter } from "../../components/grades/GradeUI"
import { assignmentDisplayStatus } from "../../utils/assignments/gradingUtils"
import { input, outlineButton } from "../../components/ui/styles"

export function AssignmentGradesPage() {
  const filters = useGradeFilters()
  const { book, now } = useGrades()
  const rows = book.assignments.filter(({ assignment }) => {
    const date = Date.parse(
      filters.value("dateField", "dueAt") === "startAt" ? assignment.startAt : assignment.dueAt,
    )
    return (
      `${assignment.code} ${assignment.title}`
        .toLowerCase()
        .includes(filters.value("q").trim().toLowerCase()) &&
      (!filters.value("status") ||
        assignmentDisplayStatus(assignment, now) === filters.value("status")) &&
      (!filters.value("from") || date >= new Date(`${filters.value("from")}T00:00:00`).getTime()) &&
      (!filters.value("to") || date <= new Date(`${filters.value("to")}T23:59:59.999`).getTime())
    )
  })
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-end gap-3 p-5">
          <input
            className={`${input} flex-[2] basis-52`}
            aria-label="搜尋作業成績"
            placeholder="搜尋作業名稱或編號"
            value={filters.value("q")}
            onChange={(event) => filters.update({ q: event.target.value })}
          />
          <GradeSelect
            label="狀態"
            value={filters.value("status")}
            onChange={(value) => filters.update({ status: value })}
          >
            <option value="">全部狀態</option>
            {["草稿", "尚未開放", "進行中", "已截止", "已封存"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </GradeSelect>
          <GradeSelect
            label="時間欄位"
            value={filters.value("dateField", "dueAt")}
            onChange={(value) => filters.update({ dateField: value })}
          >
            <option value="startAt">開放時間</option>
            <option value="dueAt">截止時間</option>
          </GradeSelect>
          <GradeDateFilter
            label="起始日期"
            value={filters.value("from")}
            onChange={(value) => filters.update({ from: value })}
          />
          <GradeDateFilter
            label="結束日期"
            value={filters.value("to")}
            onChange={(value) => filters.update({ to: value })}
          />
          <button
            type="button"
            className={outlineButton}
            onClick={filters.reset}
          >
            清除篩選
          </button>
        </div>
        <AssignmentGradeTable rows={rows} />
      </section>
    </div>
  )
}
