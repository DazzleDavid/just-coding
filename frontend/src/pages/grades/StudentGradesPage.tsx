import { Link, useLocation } from "react-router"
import { useGrades } from "../../hooks/grades/useGrades"
import { useGradeFilters } from "../../hooks/grades/useGradeFilters"
import { GradeTable, type GradeColumn } from "../../components/grades/GradeTable"
import { GradeSelect } from "../../components/grades/GradeUI"
import { gradeText, rateText } from "../../utils/grades/gradeFormat"
import { getStudentGradeSummary } from "../../utils/grades/gradeCalculation"
import type { StudentGradeSummary } from "../../types/grade"
import { input, outlineButton } from "../../components/ui/styles"

export function StudentGradesPage() {
  const filters = useGradeFilters()
  const { input: source, book, now } = useGrades()
  const location = useLocation()
  const scope = filters.value("scope", "published")
  const assignments = source.assignments.filter(
    (assignment) =>
      scope === "all" ||
      (scope === "published" && assignment.status === "published") ||
      (scope === "ended" &&
        assignment.status === "published" &&
        Date.parse(assignment.dueAt) <= now) ||
      scope === assignment.id,
  )
  const visibleIds = new Set(assignments.map((item) => item.id))
  const progress = filters.value("mode") === "progress"
  const rows = book.students
    .filter(
      (row) =>
        `${row.student.studentNumber} ${row.student.name}`
          .toLowerCase()
          .includes(filters.value("q").trim().toLowerCase()) &&
        (!filters.value("class") || row.student.className === filters.value("class")),
    )
    .map((row) =>
      getStudentGradeSummary(
        row.student,
        row.assignments.filter((grade) => visibleIds.has(grade.assignment.id)),
        now,
      ),
    )
  const columns: GradeColumn<StudentGradeSummary>[] = [
    { key: "index", label: "序號", width: 65, render: (_, index) => index + 1 },
    {
      key: "number",
      label: "學號",
      width: 150,
      render: (row) => row.student.studentNumber,
      sortValue: (row) => row.student.studentNumber,
    },
    {
      key: "name",
      label: "姓名",
      width: 140,
      render: (row) => (
        <Link
          className="text-primary hover:underline"
          to={`/grades/students/${row.student.id}${location.search}`}
        >
          {row.student.name}
        </Link>
      ),
      sortValue: (row) => row.student.name,
    },
    ...assignments.map(
      (assignment): GradeColumn<StudentGradeSummary> => ({
        key: assignment.id,
        label: assignment.code,
        width: 150,
        render: (row) => {
          const grade = row.assignments.find((item) => item.assignment.id === assignment.id)
          return grade ? (
            <span title={`${assignment.title} · 滿分 ${grade.maxScore}`}>
              {progress
                ? `${grade.submitted}/${grade.problems.length}`
                : gradeText(grade.score, grade.state)}
            </span>
          ) : (
            <span className="text-muted-foreground">不適用</span>
          )
        },
        sortValue: (row) => {
          const grade = row.assignments.find((item) => item.assignment.id === assignment.id)
          return progress ? (grade?.submitted ?? -1) : (grade?.score ?? -1)
        },
      }),
    ),
    progress
      ? {
          key: "submitted",
          label: "已提交題數",
          width: 150,
          render: (row) =>
            `${row.submitted}/${row.assignments.reduce((sum, grade) => sum + grade.problems.length, 0)}`,
          sortValue: (row) => row.submitted,
        }
      : {
          key: "average",
          label: "平均得分率",
          width: 170,
          render: (row) => (
            <>
              {rateText(row.averageRate)}
              <p className="mt-1 text-xs text-muted-foreground">樣本 {row.sampleSize} 份作業</p>
            </>
          ),
          sortValue: (row) => row.averageRate ?? -1,
        },
  ]
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-end gap-3 p-5">
          <input
            className={`${input} flex-[2] basis-52`}
            aria-label="搜尋學生成績"
            placeholder="搜尋學號或姓名"
            value={filters.value("q")}
            onChange={(event) => filters.update({ q: event.target.value })}
          />
          <GradeSelect
            label="班級"
            value={filters.value("class")}
            onChange={(value) => filters.update({ class: value })}
          >
            <option value="">全部班級</option>
            {[...new Set(source.students.map((student) => student.className))]
              .filter(Boolean)
              .sort()
              .map((name) => (
                <option key={name}>{name}</option>
              ))}
          </GradeSelect>
          <GradeSelect
            label="作業範圍"
            value={scope}
            onChange={(value) => filters.update({ scope: value })}
          >
            <option value="published">已發布作業</option>
            <option value="ended">已截止且已發布</option>
            <option value="all">所有作業</option>
            {source.assignments.map((assignment) => (
              <option
                key={assignment.id}
                value={assignment.id}
              >
                {assignment.code} · {assignment.title}
              </option>
            ))}
          </GradeSelect>
          <GradeSelect
            label="顯示模式"
            value={progress ? "progress" : "score"}
            onChange={(value) => filters.update({ mode: value })}
          >
            <option value="score">分數模式</option>
            <option value="progress">繳交進度模式</option>
          </GradeSelect>
          <button
            type="button"
            className={outlineButton}
            onClick={filters.reset}
          >
            清除篩選
          </button>
        </div>
        <GradeTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.student.id}
          empty="沒有符合條件的學生"
        />
      </section>
    </div>
  )
}
