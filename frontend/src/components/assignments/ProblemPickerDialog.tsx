import { useState } from "react"
import { useAssignments } from "../../hooks/assignments/useAssignments"
import { problemIssues } from "../../utils/problems/problemValidation"
import { FormDialog } from "../shared/ConfirmDialog"
import { Pagination } from "../shared/Pagination"
import { EmptyState } from "../shared/EmptyState"
import { StatusBadge } from "../shared/StatusBadge"
import { button, input, outlineButton, tableCell } from "../ui/styles"

export function ProblemPickerDialog({
  existingProblemIds,
  onAdd,
  onClose,
}: {
  existingProblemIds: string[]
  onAdd: (ids: string[]) => void
  onClose: () => void
}) {
  const { data } = useAssignments()
  const [query, setQuery] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [tag, setTag] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const existing = new Set(existingProblemIds)
  const filtered = data.problems.filter(
    (item) =>
      `${item.code} ${item.title}`.toLowerCase().includes(query.trim().toLowerCase()) &&
      (!difficulty || item.difficulty === difficulty) &&
      (!tag || item.tags.includes(tag)),
  )
  const perPage = size || Math.max(1, filtered.length)
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / perPage)))
  const chosen = selected.filter((id) => !existing.has(id))
  function add() {
    onAdd(chosen)
  }
  return (
    <FormDialog
      title="從題庫加入"
      description="可多選題目。加入後使用題庫預設配分，你可以在這份作業中獨立調整。未完成的題目可先加入草稿，發布前必須修正。"
      onClose={onClose}
    >
      <div className="flex flex-wrap gap-3 pb-5">
        <input
          aria-label="搜尋題庫"
          className={`${input} flex-[2] basis-48`}
          placeholder="題目名稱或編號"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
        />
        <select
          aria-label="挑選難度"
          className={`${input} flex-1 basis-28`}
          value={difficulty}
          onChange={(event) => {
            setDifficulty(event.target.value)
            setPage(1)
          }}
        >
          <option value="">全部難度</option>
          <option value="easy">簡單</option>
          <option value="medium">中等</option>
          <option value="hard">困難</option>
        </select>
        <select
          aria-label="挑選標籤"
          className={`${input} flex-1 basis-28`}
          value={tag}
          onChange={(event) => {
            setTag(event.target.value)
            setPage(1)
          }}
        >
          <option value="">全部標籤</option>
          {[...new Set(data.problems.flatMap((item) => item.tags))].sort().map((label) => (
            <option key={label}>{label}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[650px] table-fixed border-collapse">
          <colgroup>
            {[9, 17, 35, 14, 25].map((width, index) => (
              <col
                key={index}
                style={{ width: `${width}%` }}
              />
            ))}
          </colgroup>
          <thead className="bg-muted/50">
            <tr>
              {["選擇", "編號", "題目名稱", "預設配分", "完整性"].map((label) => (
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
            {filtered.slice((current - 1) * perPage, current * perPage).map((problem) => (
              <tr
                key={problem.id}
                className="border-t border-border"
              >
                <td className={tableCell}>
                  <input
                    type="checkbox"
                    aria-label={`選擇 ${problem.code} ${problem.title}`}
                    checked={existing.has(problem.id) || selected.includes(problem.id)}
                    disabled={existing.has(problem.id)}
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? [...selected, problem.id]
                          : selected.filter((id) => id !== problem.id),
                      )
                    }
                  />
                </td>
                <td className={`${tableCell} font-mono`}>{problem.code}</td>
                <td className={tableCell}>
                  {problem.title}
                  {existing.has(problem.id) && (
                    <p className="mt-1 text-xs text-muted-foreground">已加入此作業</p>
                  )}
                </td>
                <td className={tableCell}>{problem.points}</td>
                <td className={tableCell}>
                  <StatusBadge
                    label={problemIssues(problem, data.testCases).length ? "未完成" : "完整"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length && (
        <EmptyState
          title="沒有符合條件的題目"
          description="請調整篩選，或先到題目管理建立題目。"
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
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">已選擇 {chosen.length} 道新題目</p>
        <div className="flex gap-3">
          <button
            className={outlineButton}
            onClick={onClose}
          >
            取消
          </button>
          <button
            className={button}
            disabled={!chosen.length}
            onClick={add}
          >
            確認加入 {chosen.length} 道題目
          </button>
        </div>
      </div>
    </FormDialog>
  )
}
