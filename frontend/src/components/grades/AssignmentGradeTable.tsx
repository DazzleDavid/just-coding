import { Link, useLocation } from "react-router"
import type { AssignmentGradeSummary } from "../../types/grade"
import { GradeTable, type GradeColumn } from "./GradeTable"
import { rateText } from "../../utils/grades/gradeFormat"
import { assignmentDisplayStatus, formatDate } from "../../utils/assignments/gradingUtils"
import { StatusBadge } from "../shared/StatusBadge"

export function AssignmentGradeTable({ rows }: { rows: AssignmentGradeSummary[] }) {
  const location = useLocation()
  const detailLink = (id: string) => `/grades/assignments/${id}`
  const columns: GradeColumn<AssignmentGradeSummary>[] = [
    { key: "index", label: "序號", width: 65, render: (_, index) => index + 1 },
    {
      key: "code",
      label: "作業編號",
      width: 120,
      render: (row) => row.assignment.code,
      sortValue: (row) => row.assignment.code,
    },
    {
      key: "title",
      label: "作業名稱",
      width: 230,
      render: (row) => (
        <Link
          className="text-primary hover:underline"
          state={{ returnTo: location.pathname + location.search }}
          to={detailLink(row.assignment.id)}
        >
          {row.assignment.title}
        </Link>
      ),
      sortValue: (row) => row.assignment.title,
    },
    {
      key: "status",
      label: "狀態",
      width: 110,
      render: (row) => <StatusBadge label={assignmentDisplayStatus(row.assignment)} />,
    },
    {
      key: "due",
      label: "截止時間（台北）",
      width: 180,
      render: (row) => formatDate(row.assignment.dueAt),
      sortValue: (row) => Date.parse(row.assignment.dueAt),
    },
    { key: "problems", label: "題目數", width: 90, render: (row) => row.totalProblems },
    { key: "max", label: "作業滿分", width: 100, render: (row) => row.maxScore },
    { key: "students", label: "學生數", width: 100, render: (row) => row.rows.length },
    {
      key: "submitted",
      label: "已提交",
      width: 100,
      render: (row) => row.submittedStudents,
      sortValue: (row) => row.submittedStudents,
    },
    { key: "missing", label: "未提交", width: 100, render: (row) => row.unsubmittedStudents },
    {
      key: "average",
      label: "平均得分率",
      width: 160,
      render: (row) => (
        <>
          <p>{rateText(row.averageRate)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            樣本 {row.sampleSize} 人 · 待定 {row.unresolvedStudents} 人
          </p>
        </>
      ),
      sortValue: (row) => row.averageRate ?? -1,
    },
    {
      key: "actions",
      label: "操作",
      width: 120,
      render: (row) => (
        <Link
          className="text-primary hover:underline"
          state={{ returnTo: location.pathname + location.search }}
          to={detailLink(row.assignment.id)}
        >
          查看詳情
        </Link>
      ),
    },
  ]
  return (
    <GradeTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.assignment.id}
      empty="沒有符合條件的作業"
    />
  )
}
