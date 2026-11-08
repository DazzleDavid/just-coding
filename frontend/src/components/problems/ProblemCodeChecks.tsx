import { useId } from "react"
import type { ProblemDraft } from "../../types/problem"
import type { FieldErrors } from "../../utils/problems/problemValidation"
import { input } from "../ui/styles"

export function ProblemCodeChecks({
  draft,
  onChange,
  errors,
}: {
  draft: ProblemDraft
  onChange: (draft: ProblemDraft) => void
  errors: FieldErrors<ProblemDraft>
}) {
  const thresholdId = useId()
  const errorId = errors.similarityCheck ? `${thresholdId}-error` : undefined
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <label className="flex min-h-11 items-center gap-2">
          <input
            className="size-4 accent-primary"
            type="checkbox"
            checked={draft.similarityCheck.enabled}
            onChange={(event) =>
              onChange({
                ...draft,
                similarityCheck: { ...draft.similarityCheck, enabled: event.target.checked },
              })
            }
          />
          相似度檢查
        </label>
        <div
          className={`flex items-center gap-2 ${draft.similarityCheck.enabled ? "" : "text-muted-foreground"}`}
        >
          <label htmlFor={thresholdId}>警示門檻</label>
          <input
            id={thresholdId}
            aria-label="相似度警示門檻（%）"
            type="number"
            min={1}
            max={100}
            step={1}
            disabled={!draft.similarityCheck.enabled}
            className={`${input} w-24!`}
            value={
              Number.isNaN(draft.similarityCheck.threshold) ? "" : draft.similarityCheck.threshold
            }
            aria-invalid={!!errors.similarityCheck}
            aria-describedby={errorId}
            onChange={(event) =>
              onChange({
                ...draft,
                similarityCheck: {
                  ...draft.similarityCheck,
                  threshold: event.target.value === "" ? NaN : Number(event.target.value),
                },
              })
            }
          />
          <span>%</span>
        </div>
      </div>
      {errors.similarityCheck && (
        <p
          id={errorId}
          className="text-sm text-destructive"
        >
          {errors.similarityCheck}
        </p>
      )}
    </div>
  )
}
