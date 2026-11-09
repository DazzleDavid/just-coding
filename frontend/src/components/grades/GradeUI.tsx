import type { ReactNode } from "react"
import type { JudgeStatus } from "../../types/judgeRun"
import { card, input } from "../ui/styles"

const verdictLabels: Record<JudgeStatus, string> = {
  Pending: "等待評測",
  Judging: "評測中",
  AC: "答案正確",
  Partial: "部分通過",
  WA: "答案錯誤",
  TLE: "執行逾時",
  MLE: "記憶體超限",
  RE: "執行時錯誤",
  CE: "編譯失敗",
  SE: "系統錯誤",
}
export function GradeStatusBadge({ status }: { status?: JudgeStatus }) {
  const color =
    status === "AC"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : status && ["Pending", "Judging", "Partial"].includes(status)
        ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
        : status
          ? "bg-red-500/10 text-red-700 dark:text-red-300"
          : "bg-muted text-muted-foreground"
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs whitespace-nowrap ${color}`}>
      {status ? `${status} · ${verdictLabels[status]}` : "等待評測"}
    </span>
  )
}
export function GradeStats({
  items,
}: {
  items: { label: string; value: ReactNode; hint?: string }[]
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 ${items.length === 5 ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}
    >
      {items.map((item) => (
        <div
          className={card}
          key={item.label}
        >
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold">{item.value}</p>
          {item.hint && <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>}
        </div>
      ))}
    </div>
  )
}
export function GradeSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <label className="flex min-w-36 flex-1 flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <select
        className={`${input} text-foreground`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  )
}
export function GradeDateFilter({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex min-w-36 flex-1 flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <input
        type="date"
        className={`${input} text-foreground`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
