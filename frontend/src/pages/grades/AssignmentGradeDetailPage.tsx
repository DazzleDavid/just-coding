import { Link, useLocation, useParams } from "react-router"
import { useGrades } from "../../hooks/grades/useGrades"
import { useGradeFilters } from "../../hooks/grades/useGradeFilters"
import type { StudentAssignmentGrade } from "../../types/grade"
import { GradeTable, type GradeColumn } from "../../components/grades/GradeTable"
import { GradeStats, GradeSelect } from "../../components/grades/GradeUI"
import { gradeText, rateText } from "../../utils/grades/gradeFormat"
import { EmptyState } from "../../components/shared/EmptyState"
import { StatusBadge } from "../../components/shared/StatusBadge"
import {
  assignmentDisplayStatus,
  formatDate,
  problemLabel,
} from "../../utils/assignments/gradingUtils"
import { input, outlineButton } from "../../components/ui/styles"

export function AssignmentGradeDetailPage() {
  const { assignmentId } = useParams()
  const filters = useGradeFilters()
  const grades = useGrades()
  const location = useLocation()
  const summary = grades.book.assignments.find((row) => row.assignment.id === assignmentId)
  if (!summary)
    return (
      <EmptyState
        title="找不到作業"
        description="此作業不存在或已移除。"
      >
        <Link
          className={outlineButton}
          to="/grades/assignments"
        >
          返回作業成績
        </Link>
      </EmptyState>
    )
  const { assignment } = summary
  const progress = filters.value("mode") === "progress"
  const policy = grades.data.policies.find((item) => item.assignmentId === assignment.id)
  const rows = summary.rows.filter(
    (row) =>
      `${row.student.studentNumber} ${row.student.name}`
        .toLowerCase()
        .includes(filters.value("q").trim().toLowerCase()) &&
      (!filters.value("class") || row.student.className === filters.value("class")) &&
      (!filters.value("submitted") ||
        (filters.value("submitted") === "yes" ? row.submitted > 0 : row.submitted === 0)) &&
      (!filters.value("completed") ||
        (filters.value("completed") === "all"
          ? row.problems.length > 0 && row.completed === row.problems.length
          : filters.value("completed") === "none"
            ? row.completed === 0
            : row.completed > 0 && row.completed < row.problems.length)),
  )
  const relations = grades.input.assignmentProblems
    .filter((item) => item.assignmentId === assignment.id)
    .sort((a, b) => a.order - b.order)
  const columns: GradeColumn<StudentAssignmentGrade>[] = [
    { key: "index", label: "序號", width: 65, render: (_, index) => index + 1 },
    {
      key: "number",
      label: "學號",
      width: 145,
      render: (row) => row.student.studentNumber,
      sortValue: (row) => row.student.studentNumber,
    },
    {
      key: "name",
      label: "姓名",
      width: 130,
      render: (row) => (
        <Link
          className="text-primary hover:underline"
          to={`/grades/students/${row.student.id}?expand=${assignment.id}`}
        >
          {row.student.name}
        </Link>
      ),
      sortValue: (row) => row.student.name,
    },
    ...relations.map(
      (relation, index): GradeColumn<StudentAssignmentGrade> => ({
        key: relation.id,
        label: `${problemLabel(index)} 題 · ${relation.points} 分`,
        width: 145,
        render: (row) => {
          const problem = row.problems.find((item) => item.relation.id === relation.id)!
          return progress
            ? problem.submitted
              ? "已提交"
              : "未交"
            : problem.state === "unsubmitted"
              ? "—"
              : gradeText(problem.score, problem.state)
        },
        sortValue: (row) =>
          row.problems.find((item) => item.relation.id === relation.id)?.score ?? -1,
      }),
    ),
    {
      key: "submitted",
      label: "已提交題數",
      width: 150,
      render: (row) => `${row.submitted}/${row.problems.length}`,
      sortValue: (row) => row.submitted,
    },
    {
      key: "completed",
      label: "已完成題數",
      width: 150,
      render: (row) => `${row.completed}/${row.problems.length}`,
      sortValue: (row) => row.completed,
    },
    progress
      ? {
          key: "attempts",
          label: "提交總次數",
          width: 150,
          render: (row) => row.submissionCount,
          sortValue: (row) => row.submissionCount,
        }
      : {
          key: "score",
          label: "採計總分",
          width: 150,
          render: (row) => gradeText(row.score, row.state),
          sortValue: (row) => row.score ?? -1,
        },
    ...(progress
      ? [
          {
            key: "last",
            label: "最近提交（台北）",
            width: 190,
            render: (row: StudentAssignmentGrade) =>
              row.lastSubmittedAt ? formatDate(row.lastSubmittedAt) : "—",
            sortValue: (row: StudentAssignmentGrade) =>
              row.lastSubmittedAt ? Date.parse(row.lastSubmittedAt) : 0,
          },
        ]
      : []),
  ]
  const back =
    typeof location.state?.returnTo === "string" &&
    location.state.returnTo.startsWith("/grades/assignments")
      ? location.state.returnTo
      : "/grades/assignments"
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="text-sm text-primary hover:underline"
          to={back}
        >
          返回作業成績
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-card p-4 text-sm">
        <StatusBadge label={assignmentDisplayStatus(assignment, grades.now)} />
        <span>開放：{formatDate(assignment.startAt)}</span>
        <span>截止：{formatDate(assignment.dueAt)}</span>
        <span>
          {summary.totalProblems} 題 · 滿分 {summary.maxScore}
        </span>
        <span className="text-muted-foreground">
          {policy?.countLate ? "逾期提交列入採計" : "逾期提交不列入採計"}
        </span>
      </div>
      <GradeStats
        items={[
          { label: "學生總數", value: summary.rows.length },
          { label: "已提交學生", value: summary.submittedStudents },
          { label: "未提交學生", value: summary.unsubmittedStudents },
          { label: "已提交題目總數", value: summary.submittedProblems },
        ]}
      />
      {!summary.rows.length && (
        <p className="rounded-lg bg-primary/10 p-4 text-sm">
          尚無學生資料，請先至學生管理新增或匯入學生。
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        平均得分率 {rateText(summary.averageRate)} · 樣本 {summary.sampleSize} 人 · 待評測／異常{" "}
        {summary.unresolvedStudents} 人。
      </p>
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-end gap-3 p-5">
          <input
            className={`${input} flex-[2] basis-48`}
            aria-label="搜尋作業學生成績"
            placeholder="學號或姓名"
            value={filters.value("q")}
            onChange={(event) => filters.update({ q: event.target.value })}
          />
          <GradeSelect
            label="班級"
            value={filters.value("class")}
            onChange={(value) => filters.update({ class: value })}
          >
            <option value="">全部班級</option>
            {[...new Set(summary.rows.map((row) => row.student.className))]
              .filter(Boolean)
              .sort()
              .map((name) => (
                <option key={name}>{name}</option>
              ))}
          </GradeSelect>
          <GradeSelect
            label="繳交情況"
            value={filters.value("submitted")}
            onChange={(value) => filters.update({ submitted: value })}
          >
            <option value="">全部</option>
            <option value="yes">已提交</option>
            <option value="no">未提交</option>
          </GradeSelect>
          <GradeSelect
            label="完成題數"
            value={filters.value("completed")}
            onChange={(value) => filters.update({ completed: value })}
          >
            <option value="">全部</option>
            <option value="all">全部完成</option>
            <option value="some">部分完成</option>
            <option value="none">尚未完成任何題目</option>
          </GradeSelect>
          <GradeSelect
            label="顯示模式"
            value={progress ? "progress" : "score"}
            onChange={(value) => filters.update({ mode: value })}
          >
            <option value="score">分數模式</option>
            <option value="progress">繳交題數模式</option>
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
