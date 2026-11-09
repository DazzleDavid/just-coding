import { useState } from "react"
import { Link } from "react-router"
import { ArrowDown, ArrowUp } from "lucide-react"
import type { Assignment } from "../../types/assignment"
import { useAssignments } from "../../hooks/assignments/useAssignments"
import type { AssignmentProblemInput } from "../../utils/assignments/assignmentEditor"
import { configuredProblems } from "../../utils/assignments/assignmentViews"
import { problemLabel } from "../../utils/assignments/gradingUtils"
import { problemIssues } from "../../utils/problems/problemValidation"
import { EmptyState } from "../shared/EmptyState"
import { StatusBadge } from "../shared/StatusBadge"
import { button, dangerButton, input, outlineButton, tableCell } from "../ui/styles"
import { ProblemPickerDialog } from "./ProblemPickerDialog"
import { ProblemSnapshotDialog } from "./ProblemSnapshotDialog"

export function AssignmentProblemList({
  assignment,
  items,
  onChange,
}: {
  assignment: Assignment
  items: AssignmentProblemInput[]
  onChange: (items: AssignmentProblemInput[]) => void
}) {
  const { data } = useAssignments()
  const [picking, setPicking] = useState(false)
  const [snapshotId, setSnapshotId] = useState<string | null>(null)
  const editable = assignment.status === "draft"
  const rows = editable
    ? items.map((item, order) => ({
        relation: {
          id: item.problemId,
          assignmentId: assignment.id,
          problemId: item.problemId,
          order,
          points: Number(item.points),
        },
        problem: data.problems.find((problem) => problem.id === item.problemId),
        testCases: data.testCases.filter((testCase) => testCase.problemId === item.problemId),
        frozen: false,
      }))
    : configuredProblems(data, assignment)
  const snapshot = data.assignmentProblems.find((item) => item.id === snapshotId)
  const total = rows.reduce((sum, item) => sum + item.relation.points, 0)
  const validPoints = items.every(
    (item) => Number.isFinite(Number(item.points)) && Number(item.points) > 0,
  )
  function move(index: number, delta: -1 | 1) {
    const next = [...items]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="font-semibold">題目配置</h2>
          <p className="text-sm text-muted-foreground">
            共 {rows.length} 題 · 總分 {validPoints ? total : "—"} 分
          </p>
        </div>
        {editable && (
          <button
            type="button"
            className={button}
            onClick={() => setPicking(true)}
          >
            從題庫加入
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] table-fixed border-collapse">
          <colgroup>
            {[7, 34, 16, 12, 31].map((width, index) => (
              <col
                key={index}
                style={{ width: `${width}%` }}
              />
            ))}
          </colgroup>
          <thead className="bg-muted/50">
            <tr>
              {["題序", "題目", "作業內配分", "完整性", "操作"].map((label) => (
                <th
                  className={tableCell}
                  scope="col"
                  key={label}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ relation, problem, testCases, frozen }, index) => {
              const invalid =
                editable &&
                (!Number.isFinite(Number(items[index].points)) || Number(items[index].points) <= 0)
              return (
                <tr
                  key={relation.problemId}
                  className="border-t border-border"
                >
                  <td className={tableCell}>{problemLabel(index)}</td>
                  <td className={tableCell}>
                    <p className="font-medium">
                      {problem?.code} · {problem?.title ?? "找不到題目"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      啟用測資 {testCases.filter((item) => item.enabled).length} 筆
                    </p>
                  </td>
                  <td className={tableCell}>
                    {editable ? (
                      <>
                        <input
                          aria-label={`題目 ${problemLabel(index)} 作業內配分`}
                          className={`${input} max-w-32`}
                          type="number"
                          min={0.01}
                          step="any"
                          value={items[index].points}
                          aria-invalid={invalid}
                          aria-describedby={invalid ? `points-error-${index}` : undefined}
                          onChange={(event) =>
                            onChange(
                              items.map((item, row) =>
                                row === index ? { ...item, points: event.target.value } : item,
                              ),
                            )
                          }
                        />
                        {invalid && (
                          <p
                            id={`points-error-${index}`}
                            className="mt-1 text-xs text-destructive"
                          >
                            配分須大於 0
                          </p>
                        )}
                      </>
                    ) : (
                      `${relation.points} 分`
                    )}
                  </td>
                  <td className={tableCell}>
                    <StatusBadge
                      label={
                        problem && !problemIssues(problem, testCases).length ? "完整" : "未完成"
                      }
                    />
                  </td>
                  <td className={tableCell}>
                    <div className="flex flex-wrap gap-2">
                      {frozen ? (
                        <button
                          type="button"
                          className={outlineButton}
                          onClick={() => setSnapshotId(relation.id)}
                        >
                          查看發布內容
                        </button>
                      ) : (
                        <Link
                          className={outlineButton}
                          to={`/problems/${relation.problemId}/details`}
                        >
                          查看題目
                        </Link>
                      )}
                      {editable && (
                        <>
                          <button
                            type="button"
                            className={`${outlineButton} px-3!`}
                            disabled={index === 0}
                            aria-label={`上移題目 ${problemLabel(index)}`}
                            onClick={() => move(index, -1)}
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            className={`${outlineButton} px-3!`}
                            disabled={index === rows.length - 1}
                            aria-label={`下移題目 ${problemLabel(index)}`}
                            onClick={() => move(index, 1)}
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            type="button"
                            className={dangerButton}
                            onClick={() =>
                              onChange(
                                items.filter((item) => item.problemId !== relation.problemId),
                              )
                            }
                          >
                            移除
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <EmptyState
          title="尚未配置題目"
          description={
            editable ? "點選「從題庫加入」，選取題目後可調整題序與配分。" : "此作業沒有題目。"
          }
        />
      )}
      {editable && rows.length > 0 && (
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          加入、移除、排序及配分修改後，按上方「儲存修改」套用。
        </p>
      )}
      {picking && (
        <ProblemPickerDialog
          existingProblemIds={items.map((item) => item.problemId)}
          onClose={() => setPicking(false)}
          onAdd={(ids) => {
            const existing = new Set(items.map((item) => item.problemId))
            const additions = data.problems.filter(
              (problem) => ids.includes(problem.id) && !existing.has(problem.id),
            )
            onChange([
              ...items,
              ...additions.map((problem) => ({
                problemId: problem.id,
                points: String(problem.points),
              })),
            ])
            setPicking(false)
          }}
        />
      )}
      {snapshot?.publishedSnapshot && (
        <ProblemSnapshotDialog
          relation={snapshot}
          onClose={() => setSnapshotId(null)}
        />
      )}
    </section>
  )
}
