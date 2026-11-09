import { useState } from "react"
import type { AssignmentGradeSummary } from "../../types/grade"
import { input, outlineButton } from "../ui/styles"

export function GradeExportAssignmentPicker({
  summaries,
  ids,
  onChange,
  disabled,
}: {
  summaries: AssignmentGradeSummary[]
  ids: string[]
  onChange: (ids: string[]) => void
  disabled: boolean
}) {
  const [query, setQuery] = useState("")
  const options = summaries.filter((summary) =>
    `${summary.assignment.code} ${summary.assignment.title}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  )
  return (
    <fieldset
      disabled={disabled}
      className="space-y-3"
    >
      <legend className="mb-2 text-sm font-medium">
        選擇作業 <span className="text-destructive">*</span>
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          已選 {ids.length} 份 · 依勾選順序匯出欄位
        </span>
      </legend>
      <div className="flex flex-wrap gap-2">
        <input
          className={`${input} min-w-0 flex-1 basis-44`}
          aria-label="搜尋匯出作業"
          placeholder="搜尋作業編號或名稱"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          type="button"
          className={outlineButton}
          onClick={() =>
            onChange([
              ...new Set([
                ...ids,
                ...options
                  .filter((item) => item.assignment.status !== "draft")
                  .map((item) => item.assignment.id),
              ]),
            ])
          }
        >
          選取搜尋結果
        </button>
        <button
          type="button"
          className={outlineButton}
          onClick={() => onChange([])}
        >
          清除選取
        </button>
      </div>
      <div className="grid max-h-52 gap-2 overflow-y-auto rounded-lg border border-border p-3 sm:grid-cols-2">
        {options.map(({ assignment, rows }) => (
          <label
            key={assignment.id}
            className={`flex items-start gap-3 rounded-lg p-2 text-sm ${assignment.status === "draft" ? "opacity-50" : "hover:bg-accent"}`}
          >
            <input
              type="checkbox"
              className="mt-1"
              disabled={assignment.status === "draft"}
              checked={ids.includes(assignment.id)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...ids, assignment.id]
                    : ids.filter((id) => id !== assignment.id),
                )
              }
            />
            <span className="min-w-0">
              <span className="block font-medium">
                {assignment.code} · {assignment.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {assignment.status === "draft" ? "草稿不計分" : `學生 ${rows.length} 人`}
              </span>
            </span>
          </label>
        ))}
        {!options.length && <p className="text-sm text-muted-foreground">沒有符合條件的作業。</p>}
      </div>
    </fieldset>
  )
}
