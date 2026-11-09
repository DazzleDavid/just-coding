import { Link, useParams } from "react-router"
import { useGrades } from "../../hooks/grades/useGrades"
import { GradeDataNotice } from "../../components/grades/GradeDataNotice"
import { GradeStatusBadge } from "../../components/grades/GradeUI"
import { EmptyState } from "../../components/shared/EmptyState"
import { card, outlineButton, tableCell } from "../../components/ui/styles"
import { formatDate } from "../../utils/assignments/gradingUtils"
import { submissionCountingLabel } from "../../utils/grades/gradeFormat"

export function SubmissionDetailPage() {
  const { submissionId } = useParams()
  const { book, data, error } = useGrades()
  const row = book.submissions.find(
    (item) => item.submission.id === submissionId && !item.submission.deleted,
  )
  if (!row)
    return (
      <EmptyState
        title="找不到提交紀錄"
        description={error || "此筆資料不存在或已移除。"}
      >
        <Link
          className={outlineButton}
          to="/submissions"
        >
          返回繳交紀錄
        </Link>
      </EmptyState>
    )
  const history = data.judgeRuns.filter((run) => run.submissionId === submissionId)
  return (
    <div className="space-y-5 p-4 sm:p-6">
      <GradeDataNotice />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="text-sm text-primary hover:underline"
          to={`/submissions?student=${row.submission.studentId}&assignment=${row.submission.assignmentId}&problem=${row.submission.assignmentProblemId}`}
        >
          查看此題歷次提交
        </Link>
        <GradeStatusBadge status={row.run?.status} />
      </div>
      <section className={card}>
        <dl className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["學生", `${row.student?.studentNumber ?? "—"} · ${row.student?.name ?? "學生已移除"}`],
            ["作業", `${row.assignment?.code ?? "—"} · ${row.assignment?.title ?? "作業已移除"}`],
            ["題目", row.problem?.title ?? "題目已移除"],
            ["提交時間（台北）", formatDate(row.submission.submittedAt)],
            ["語言", row.submission.language],
            ["提交次數", `第 ${row.submission.submissionNumber} 次`],
            [
              "評測分數",
              row.score === null
                ? "尚無有效分數"
                : `${Number(row.score.toFixed(2))} / ${row.relation?.points}`,
            ],
            ["採計狀態", submissionCountingLabel(row)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="mt-1 break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className={card}>
        <h2 className="mb-3 font-semibold">程式碼</h2>
        <pre className="max-h-[36rem] overflow-auto rounded-lg bg-muted p-4 font-mono text-sm leading-6 whitespace-pre">
          <code>{row.submission.sourceCode}</code>
        </pre>
      </section>
      <section className={card}>
        <h2 className="mb-3 font-semibold">評測歷史</h2>
        <div className="space-y-3">
          {history.map((run) => (
            <details
              key={run.id}
              className="rounded-lg border border-border p-4"
              open={run.id === row.submission.currentJudgeRunId || undefined}
            >
              <summary className="cursor-pointer text-sm">
                <GradeStatusBadge status={run.status} />
                <span className="ml-3">
                  {run.id === row.submission.currentJudgeRunId ? "目前指定評測" : "歷史評測"} ·{" "}
                  {run.judgedAt ? formatDate(run.judgedAt) : "尚未完成"} ·{" "}
                  {run.score === null ? "—" : `${run.score} / ${run.maxScore}`}
                </span>
              </summary>
              <p className="mt-3 text-xs text-muted-foreground">
                評測識別：{run.id} · {run.valid ? "結果有效" : "結果已作廢"}
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[600px] table-fixed text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {["測資", "結果", "得分", "執行時間", "記憶體"].map((label) => (
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
                    {run.testCaseResults.map((result) => (
                      <tr
                        key={result.testCaseId}
                        className="border-t border-border"
                      >
                        <td className={tableCell}>
                          {row.relation?.publishedSnapshot?.testCases.find(
                            (item) => item.id === result.testCaseId,
                          )?.name ?? result.testCaseId}
                        </td>
                        <td className={tableCell}>{result.verdict}</td>
                        <td className={tableCell}>{Number(result.earnedScore.toFixed(2))}</td>
                        <td className={tableCell}>{result.executionTimeMs} ms</td>
                        <td className={tableCell}>{result.memoryUsedKb} KB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!run.testCaseResults.length && (
                <p className="mt-3 text-sm text-muted-foreground">尚無逐筆測資結果。</p>
              )}
            </details>
          ))}
        </div>
        {!history.length && <p className="text-sm text-muted-foreground">尚無評測紀錄。</p>}
      </section>
    </div>
  )
}
