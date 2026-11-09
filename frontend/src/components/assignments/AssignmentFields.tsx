import type { AssignmentDraft, AssignmentStatus } from "../../types/assignment"
import type { FieldErrors } from "../../utils/problems/problemValidation"
import { FormField } from "../shared/FormField"
import { input } from "../ui/styles"

export function AssignmentFields({
  draft,
  status,
  errors,
  onChange,
}: {
  draft: AssignmentDraft
  status: AssignmentStatus
  errors: FieldErrors<AssignmentDraft>
  onChange: (draft: AssignmentDraft) => void
}) {
  const archived = status === "archived"
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {(
        [
          ["code", "作業編號"],
          ["title", "作業名稱"],
          ["startAt", "開放時間"],
          ["dueAt", "截止時間"],
        ] as const
      ).map(([key, label]) => (
        <div
          key={key}
          className={key === "title" ? "xl:col-span-3" : key.endsWith("At") ? "xl:col-span-2" : ""}
        >
          <FormField
            label={label}
            required
            error={errors[key]}
          >
            {(id, description) => (
              <input
                id={id}
                type={key.endsWith("At") ? "datetime-local" : "text"}
                required
                readOnly={
                  archived || (status === "published" && (key === "code" || key === "startAt"))
                }
                value={draft[key]}
                aria-invalid={!!errors[key]}
                aria-describedby={description}
                className={`${input} read-only:bg-muted read-only:text-muted-foreground`}
                onChange={(event) => onChange({ ...draft, [key]: event.target.value })}
              />
            )}
          </FormField>
        </div>
      ))}
      <div className="sm:col-span-2 xl:col-span-4">
        <FormField label="作業說明">
          {(id) => (
            <textarea
              id={id}
              rows={2}
              readOnly={archived}
              className={`${input} read-only:bg-muted read-only:text-muted-foreground`}
              value={draft.description}
              onChange={(event) => onChange({ ...draft, description: event.target.value })}
            />
          )}
        </FormField>
      </div>
    </div>
  )
}
