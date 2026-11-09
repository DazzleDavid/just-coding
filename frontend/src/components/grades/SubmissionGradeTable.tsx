import { Link } from "react-router"
import type { SubmissionView } from "../../types/grade"
import { formatDate, problemLabel } from "../../utils/assignments/gradingUtils"
import { GradeTable, type GradeColumn } from "./GradeTable"
import { GradeStatusBadge } from "./GradeUI"
import { submissionCountingLabel } from "../../utils/grades/gradeFormat"

export function SubmissionGradeTable({ rows }: { rows: SubmissionView[] }) {
  const columns: GradeColumn<SubmissionView>[] = [
    {
      key: "id",
      label: "Submission ID",
      width: 190,
      render: (row) => (
        <span
          className="block truncate font-mono"
          title={row.submission.id}
        >
          {row.submission.id}
        </span>
      ),
    },
    {
      key: "number",
      label: "學號",
      width: 140,
      render: (row) => row.student?.studentNumber ?? "學生已移除",
      sortValue: (row) => row.student?.studentNumber ?? "",
    },
    {
      key: "name",
      label: "姓名",
      width: 130,
      render: (row) =>
        row.student ? (
          <Link
            className="text-primary hover:underline"
            to={`/students/${row.student.id}`}
          >
            {row.student.name}
          </Link>
        ) : (
          "—"
        ),
      sortValue: (row) => row.student?.name ?? "",
    },
    {
      key: "assignment",
      label: "作業",
      width: 190,
      render: (row) =>
        row.assignment ? (
          <Link
            className="text-primary hover:underline"
            to={`/assignments/${row.assignment.id}`}
          >
            {row.assignment.code} · {row.assignment.title}
          </Link>
        ) : (
          "作業已移除"
        ),
    },
    {
      key: "problem",
      label: "題目",
      width: 190,
      render: (row) =>
        row.relation
          ? `${problemLabel(row.relation.order)} · ${row.problem?.title ?? "題目已移除"}`
          : "關聯已移除",
    },
    { key: "language", label: "語言", width: 100, render: (row) => row.submission.language },
    {
      key: "time",
      label: "提交時間（台北）",
      width: 180,
      render: (row) => formatDate(row.submission.submittedAt),
      sortValue: (row) => Date.parse(row.submission.submittedAt),
    },
    {
      key: "attempt",
      label: "第幾次",
      width: 90,
      render: (row) => row.submission.submissionNumber,
      sortValue: (row) => row.submission.submissionNumber,
    },
    {
      key: "status",
      label: "評測狀態",
      width: 190,
      render: (row) => <GradeStatusBadge status={row.run?.status} />,
    },
    {
      key: "cases",
      label: "通過測資",
      width: 110,
      render: (row) =>
        row.run && !["Pending", "Judging", "SE"].includes(row.run.status)
          ? `${row.run.testCaseResults.filter((item) => item.verdict === "AC").length}/${row.run.testCaseResults.length}`
          : "—",
    },
    {
      key: "score",
      label: "評測分數",
      width: 130,
      render: (row) =>
        row.score === null
          ? ["Pending", "Judging"].includes(row.run?.status ?? "Pending")
            ? "待評測"
            : "不適用"
          : `${Number(row.score.toFixed(2))} / ${row.relation?.points}`,
      sortValue: (row) => row.score ?? -1,
    },
    { key: "counted", label: "採計狀態", width: 180, render: submissionCountingLabel },
    {
      key: "code",
      label: "操作",
      width: 130,
      render: (row) => (
        <Link
          className="text-primary hover:underline"
          to={`/submissions/${row.submission.id}`}
        >
          查看程式碼
        </Link>
      ),
    },
  ]
  return (
    <GradeTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.submission.id}
      empty="沒有程式碼提交紀錄"
    />
  )
}
