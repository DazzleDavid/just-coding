import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import { X, Users, UserCheck, UserX, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import type { StudentSortKey } from "../../lib/useStudentSort"
import {
  emptyStudent,
  normalizeStudent,
  validateStudent,
  type Student,
  type StudentDraft,
  type StudentErrors,
} from "../../lib/students"
import { useStudents } from "./StudentStore"

export const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
export const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
export const fieldClass =
  "min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
export const cellClass = "px-4 py-4 text-left text-sm break-words"
export const dangerButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-medium text-white transition-colors hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:bg-red-800 dark:hover:bg-red-700 disabled:opacity-50"
export const successButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:bg-emerald-800 dark:hover:bg-emerald-700 disabled:opacity-50"

export function StudentColumnHeader({
  title,
  sortKey,
  direction,
  onSort,
}: {
  title: string
  sortKey: StudentSortKey | null
  direction: "ascending" | "descending"
  onSort: (key: StudentSortKey) => void
}) {
  const key = title === "學號" ? "studentNumber" : title === "姓名" ? "name" : null
  const active = key !== null && key === sortKey
  const Icon = active ? (direction === "ascending" ? ArrowUp : ArrowDown) : ArrowUpDown
  const nextAction = !active
    ? "切換為遞增排序"
    : direction === "ascending"
      ? "切換為遞減排序"
      : "取消排序，恢復原始順序"
  return (
    <th
      scope="col"
      aria-sort={key ? (active ? direction : "none") : undefined}
      className={`${cellClass} font-medium`}
    >
      {key ? (
        <button
          type="button"
          onClick={() => onSort(key)}
          aria-label={`${title}：${nextAction}`}
          title={nextAction}
          className="inline-flex min-h-11 items-center gap-1 rounded text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          {title}
          <sup
            aria-label="必填"
            className="text-destructive"
          >
            *
          </sup>
          <Icon
            size={15}
            aria-hidden="true"
            className={active ? "text-primary" : "text-muted-foreground"}
          />
        </button>
      ) : (
        title
      )}
    </th>
  )
}

export function PageSizeSelect({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
      每頁顯示
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`${fieldClass} w-auto text-foreground`}
      >
        {[10, 25, 50, 100].map((count) => (
          <option
            key={count}
            value={count}
          >
            {count} 筆
          </option>
        ))}
        <option value={0}>全部</option>
      </select>
    </label>
  )
}

export function StudentStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}
    >
      {active ? <UserCheck size={13} /> : <UserX size={13} />}
      {active ? "啟用" : "停用"}
    </span>
  )
}

export function StudentStats({ students }: { students: Student[] }) {
  const active = students.filter((student) => student.active).length
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        { title: "學生總數", value: students.length, Icon: Users },
        { title: "啟用帳號", value: active, Icon: UserCheck },
        { title: "停用帳號", value: students.length - active, Icon: UserX },
      ].map(({ title, value, Icon }) => (
        <div
          key={title}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            {title}
            <Icon
              size={20}
              className="text-primary"
            />
          </div>
          <p className="mt-4 text-3xl font-bold tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  )
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    const previous = document.activeElement
    dialog.showModal()
    return () => {
      dialog.close()
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      aria-labelledby="student-dialog-title"
      onCancel={onClose}
      className="fixed inset-0 m-auto max-h-[90svh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-border bg-card p-6 text-foreground shadow-xl backdrop:bg-black/50 sm:p-8"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2
          id="student-dialog-title"
          className="text-xl font-semibold"
        >
          {title}
        </h2>
        <button
          type="button"
          aria-label="關閉視窗"
          onClick={onClose}
          className={secondaryButton}
        >
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  )
}

export function StudentFormDialog({
  student,
  onClose,
  onSaved,
}: {
  student?: Student
  onClose: () => void
  onSaved?: () => void
}) {
  const { students, saveStudent } = useStudents()
  const [draft, setDraft] = useState<StudentDraft>(student ?? emptyStudent)
  const [errors, setErrors] = useState<StudentErrors>({})
  const [failure, setFailure] = useState("")
  const [saving, setSaving] = useState(false)
  function submit(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizeStudent(draft)
    const nextErrors = validateStudent(normalized, students, student?.id)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSaving(true)
    try {
      saveStudent(normalized, student?.id)
      onSaved?.()
      onClose()
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "儲存失敗。")
      setSaving(false)
    }
  }
  const fields: { key: keyof StudentDraft; title: string; required?: boolean }[] = [
    { key: "studentNumber", title: "學號", required: true },
    { key: "name", title: "姓名", required: true },
    { key: "email", title: "Email（選填）" },
    { key: "className", title: "班級" },
    { key: "notes", title: "備註" },
  ]
  return (
    <Modal
      title={student ? "編輯學生資料" : "新增學生"}
      onClose={onClose}
    >
      <p className="mb-6 text-sm text-muted-foreground">
        填寫學生基本資料。此階段僅更新本機模擬資料，不會建立後端帳號。
      </p>
      <form
        onSubmit={submit}
        noValidate
        className="grid gap-5 sm:grid-cols-2"
      >
        {fields.map(({ key, title, required }) => (
          <div
            key={key}
            className={key === "notes" || key === "email" ? "sm:col-span-2" : ""}
          >
            <label
              htmlFor={`student-${key}`}
              className="mb-2 block text-sm font-medium"
            >
              {title}
              {required && (
                <sup
                  aria-label="必填"
                  className="ml-1 text-destructive"
                >
                  *
                </sup>
              )}
            </label>
            {key === "notes" ? (
              <textarea
                id={`student-${key}`}
                value={draft[key]}
                onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                rows={3}
                aria-invalid={!!errors[key]}
                aria-describedby={errors[key] ? `error-${key}` : undefined}
                className={fieldClass}
              />
            ) : (
              <input
                id={`student-${key}`}
                type={key === "email" ? "email" : "text"}
                value={draft[key]}
                readOnly={key === "studentNumber" && !!student}
                required={required}
                aria-invalid={!!errors[key]}
                aria-describedby={errors[key] ? `error-${key}` : undefined}
                onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                className={`${fieldClass} read-only:bg-muted`}
              />
            )}
            {key === "notes" && (
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {draft.notes.length} / 200
              </p>
            )}
            {errors[key] && (
              <p
                id={`error-${key}`}
                className="mt-1 text-sm text-destructive"
              >
                {errors[key]}
              </p>
            )}
          </div>
        ))}
        {failure && (
          <p
            role="alert"
            className="text-sm text-destructive sm:col-span-2"
          >
            {failure}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-border pt-5 sm:col-span-2">
          <button
            type="button"
            onClick={onClose}
            className={secondaryButton}
          >
            取消
          </button>
          <button
            disabled={saving}
            className={primaryButton}
          >
            {saving ? "儲存中…" : student ? "儲存變更" : "新增學生"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function StatusDialog({ student, onClose }: { student: Student; onClose: () => void }) {
  const { setActive } = useStudents()
  const [failure, setFailure] = useState("")
  const action = student.active ? "停用" : "啟用"
  return (
    <Modal
      title={`${action}帳號`}
      onClose={onClose}
    >
      <p className="text-sm leading-7">
        確定要{action} {student.name}（{student.studentNumber}）的帳號嗎？
      </p>
      {failure && (
        <p
          role="alert"
          className="mt-4 text-sm text-destructive"
        >
          {failure}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          className={secondaryButton}
          onClick={onClose}
        >
          取消
        </button>
        <button
          className={student.active ? dangerButton : successButton}
          onClick={() => {
            try {
              setActive(student.id, !student.active)
              onClose()
            } catch (error) {
              setFailure(error instanceof Error ? error.message : "操作失敗。")
            }
          }}
        >
          確認{action}
        </button>
      </div>
    </Modal>
  )
}
