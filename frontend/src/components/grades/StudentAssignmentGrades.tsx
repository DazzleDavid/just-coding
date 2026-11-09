import { Link } from "react-router"
import type { StudentAssignmentGrade } from "../../types/grade"
import { formatDate, problemLabel } from "../../utils/assignments/gradingUtils"
import { GradeStatusBadge } from "./GradeUI"
import { gradeText } from "../../utils/grades/gradeFormat"
import { tableCell } from "../ui/styles"

export function StudentAssignmentGrades({
  rows,
  expanded,
}: {
  rows: StudentAssignmentGrade[]
  expanded: string
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <details
          key={row.assignment.id}
          open={row.assignment.id === expanded || undefined}
          className="rounded-xl border border-border bg-card"
        >
          <summary className="cursor-pointer p-5 focus-visible:outline-2 focus-visible:outline-ring">
            <span className="ml-2 font-semibold">
              {row.assignment.code} · {row.assignment.title}
            </span>
            <span className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span>截止 {formatDate(row.assignment.dueAt)}</span>
              <span>共 {row.problems.length} 題</span>
              <span>已提交 {row.submitted} 題</span>
              <span>已完成 {row.completed} 題</span>
              <span>提交 {row.submissionCount} 次</span>
              <span className="font-medium text-foreground">
                採計 {gradeText(row.score, row.state)} / {row.maxScore}
              </span>
            </span>
          </summary>
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full min-w-[1020px] table-fixed">
              <colgroup>
                {[7, 25, 10, 12, 10, 10, 26].map((width, index) => (
                  <col
                    key={index}
                    style={{ width: `${width}%` }}
                  />
                ))}
              </colgroup>
              <thead className="bg-muted/50">
                <tr>
                  {[
                    "題號",
                    "題目與歷次提交",
                    "配分",
                    "採計分數",
                    "有效提交",
                    "完全通過",
                    "最近有效提交（台北）",
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
                {row.problems.map((problem, index) => (
                  <tr
                    className="border-t border-border align-top"
                    key={problem.relation.id}
                  >
                    <td className={tableCell}>{problemLabel(index)}</td>
                    <td className={tableCell}>
                      <details>
                        <summary className="cursor-pointer font-medium">
                          {problem.problem?.title ?? "題目已移除"}
                        </summary>
                        <ul className="mt-3 space-y-3">
                          {[...problem.submissions]
                            .sort(
                              (a, b) =>
                                Date.parse(a.submission.submittedAt) -
                                Date.parse(b.submission.submittedAt),
                            )
                            .map((view) => (
                              <li
                                key={view.submission.id}
                                className="space-y-1 rounded-lg bg-muted/50 p-3"
                              >
                                <Link
                                  className="text-primary hover:underline"
                                  to={`/submissions/${view.submission.id}`}
                                >
                                  第 {view.submission.submissionNumber} 次 ·{" "}
                                  {view.score === null
                                    ? "尚無有效分數"
                                    : `${Number(view.score.toFixed(2))} / ${problem.relation.points}`}
                                </Link>
                                <div>
                                  <GradeStatusBadge status={view.run?.status} />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {view.validity ?? (view.counted ? "本題最終採計" : "有效提交")}
                                </p>
                              </li>
                            ))}
                        </ul>
                        {!problem.submissions.length && (
                          <p className="mt-2 text-xs text-muted-foreground">尚無提交紀錄</p>
                        )}
                      </details>
                    </td>
                    <td className={tableCell}>{problem.relation.points}</td>
                    <td className={tableCell}>{gradeText(problem.score, problem.state)}</td>
                    <td className={tableCell}>
                      {problem.submissions.filter((view) => view.validity === null).length} 次
                    </td>
                    <td className={tableCell}>{problem.completed ? "是" : "否"}</td>
                    <td className={tableCell}>
                      {problem.lastSubmittedAt ? formatDate(problem.lastSubmittedAt) : "—"}
                      <Link
                        className="mt-2 block text-primary hover:underline"
                        to={`/grades/submissions?student=${row.student.id}&assignment=${row.assignment.id}&problem=${problem.relation.id}`}
                      >
                        查看全部提交
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ))}
    </div>
  )
}
