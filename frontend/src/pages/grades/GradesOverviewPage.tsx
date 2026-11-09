import { Link } from "react-router"
import { useGrades } from "../../hooks/grades/useGrades"
import { GradeStats, GradeStatusBadge } from "../../components/grades/GradeUI"
import { EmptyState } from "../../components/shared/EmptyState"
import { tableCell } from "../../components/ui/styles"
import { formatDate } from "../../utils/assignments/gradingUtils"

export function GradesOverviewPage() {
  const { book, input } = useGrades()
  const valid = book.submissions.filter((item) => item.validity === null)
  const recent = [...book.submissions]
    .filter((item) => !item.submission.deleted)
    .sort((a, b) => Date.parse(b.submission.submittedAt) - Date.parse(a.submission.submittedAt))
    .slice(0, 5)
  const assignments = [...book.assignments]
    .sort((a, b) => Date.parse(b.assignment.updatedAt) - Date.parse(a.assignment.updatedAt))
    .slice(0, 5)
  return (
    <div className="space-y-5">
      <GradeStats
        items={[
          { label: "學生總數", value: input.students.length },
          { label: "作業總數", value: input.assignments.length },
          {
            label: "已繳交學生數",
            value: new Set(valid.map((item) => item.submission.studentId)).size,
            hint: "所有作業中至少一次有效提交的不同學生",
          },
          {
            label: "有效提交總次數",
            value: valid.length,
            hint: "符合接收狀態及繳交時間政策",
          },
        ]}
      />
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 p-5">
          <h2 className="font-semibold">最近作業成績概況</h2>
          <Link
            className="text-sm text-primary hover:underline"
            to="/grades/assignments"
          >
            所有作業
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] table-fixed">
            <thead className="bg-muted/50">
              <tr>
                {[
                  "作業編號",
                  "作業名稱",
                  "總題數",
                  "學生人數",
                  "已提交人數",
                  "未提交人數",
                  "操作",
                ].map((label) => (
                  <th
                    className={tableCell}
                    key={label}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.map((row) => (
                <tr
                  key={row.assignment.id}
                  className="border-t border-border"
                >
                  <td className={tableCell}>{row.assignment.code}</td>
                  <td className={tableCell}>{row.assignment.title}</td>
                  <td className={tableCell}>{row.totalProblems}</td>
                  <td className={tableCell}>{row.rows.length}</td>
                  <td className={tableCell}>{row.submittedStudents}</td>
                  <td className={tableCell}>{row.unsubmittedStudents}</td>
                  <td className={tableCell}>
                    <Link
                      className="text-primary hover:underline"
                      to={`/grades/assignments/${row.assignment.id}`}
                    >
                      查看成績
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!assignments.length && (
          <EmptyState
            title="尚無作業"
            description="請先至作業管理建立作業。"
          />
        )}
      </section>
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 p-5">
          <h2 className="font-semibold">最近程式碼提交</h2>
          <Link
            className="text-sm text-primary hover:underline"
            to="/grades/submissions"
          >
            所有提交
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] table-fixed">
            <thead className="bg-muted/50">
              <tr>
                {["學生", "作業", "題目", "提交時間（台北）", "評測狀態"].map((label) => (
                  <th
                    className={tableCell}
                    key={label}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((row) => (
                <tr
                  key={row.submission.id}
                  className="border-t border-border"
                >
                  <td className={tableCell}>
                    <Link
                      className="text-primary hover:underline"
                      to={`/submissions/${row.submission.id}`}
                    >
                      {row.student?.studentNumber} {row.student?.name ?? "學生已移除"}
                    </Link>
                  </td>
                  <td className={tableCell}>{row.assignment?.code ?? "作業已移除"}</td>
                  <td className={tableCell}>{row.problem?.title ?? "題目已移除"}</td>
                  <td className={tableCell}>{formatDate(row.submission.submittedAt)}</td>
                  <td className={tableCell}>
                    <GradeStatusBadge status={row.run?.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!recent.length && (
          <EmptyState
            title="尚無程式碼提交"
            description="收到提交資料後，將自動顯示評測狀態及成績。"
          />
        )}
      </section>
    </div>
  )
}
