import type { ProblemDraft } from "../../types/problem"
import type { FieldErrors } from "../../utils/problems/problemValidation"
import { FormField } from "../shared/FormField"
import { input } from "../ui/styles"

export function GradingSettings({ draft, onChange, errors, readOnly }: { draft: ProblemDraft; onChange: (draft: ProblemDraft) => void; errors: FieldErrors<ProblemDraft>; readOnly: boolean }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {([ ["points", "預設配分（作業可覆寫）", 0.01, 100000], ["timeLimitMs", "時間限制（ms）", 1, 60000], ["memoryLimitMb", "記憶體限制（MB）", 1, 4096] ] as const).map(([key, label, min, max]) => <FormField key={key} label={label} required error={errors[key]}>{(id, description) => <input id={id} disabled={readOnly} type="number" min={min} max={max} step={key === "points" ? "any" : 1} className={input} value={Number.isNaN(draft[key]) ? "" : draft[key]} aria-invalid={!!errors[key]} aria-describedby={description} onChange={(event) => onChange({ ...draft, [key]: event.target.value === "" ? NaN : Number(event.target.value) })} />}</FormField>)}
  </div>
}
