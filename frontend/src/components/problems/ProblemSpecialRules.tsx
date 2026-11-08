import { Ban, CheckCircle2, Minus } from "lucide-react"
import type { ProblemDraft } from "../../types/problem"
import type { SpecialRuleCheck, SpecialRuleFeature } from "../../types/specialRule"
import type { FieldErrors } from "../../utils/problems/problemValidation"
import { specialRuleCatalog } from "../../data/problems/specialRuleCatalog"
import { useProblems } from "../../hooks/problems/useProblems"
import { card, input } from "../ui/styles"

export function ProblemSpecialRules({ draft, onChange, errors }: { draft: ProblemDraft; onChange: (draft: ProblemDraft) => void; errors: FieldErrors<ProblemDraft> }) {
  const { data } = useProblems()
  function setRule(feature: SpecialRuleFeature, mode: string) {
    const checks = draft.specialRuleChecks.filter((check) => check.feature !== feature)
    if (mode === "required" || mode === "forbidden") checks.push({ feature, mode })
    const ordered = specialRuleCatalog.flatMap((item) => checks.filter((check) => check.feature === item.feature))
    onChange({ ...draft, specialRuleChecks: ordered })
  }
  const required = draft.specialRuleChecks.filter((check) => check.mode === "required").length
  const forbidden = draft.specialRuleChecks.filter((check) => check.mode === "forbidden").length
  const legacy = data.specialRules.filter((rule) => draft.specialRuleIds.includes(rule.id))
  return <section className={card}>
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><h2 className="text-lg font-semibold">特殊規則檢查</h2><div className="flex gap-2 text-xs font-semibold"><span className="rounded-full bg-primary px-3 py-1.5 text-primary-foreground">必用 {required} 項</span><span className="rounded-full bg-destructive px-3 py-1.5 text-white dark:text-background">禁用 {forbidden} 項</span></div></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {specialRuleCatalog.map(({ feature, label }) => {
        const mode = draft.specialRuleChecks.find((check) => check.feature === feature)?.mode ?? "none"
        const Icon = mode === "required" ? CheckCircle2 : mode === "forbidden" ? Ban : Minus
        const status = mode === "required" ? "必用" : mode === "forbidden" ? "禁用" : "不檢查"
        return <label key={feature} className={`flex flex-col gap-3 rounded-lg border-2 p-4 transition-colors ${mode === "forbidden" ? "border-destructive bg-destructive/10 dark:bg-destructive/15" : mode === "required" ? "border-primary bg-primary/10 dark:bg-primary/15" : "border-border bg-card"}`}>
          <span className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold">{label}</span><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${mode === "forbidden" ? "bg-destructive text-white dark:text-background" : mode === "required" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}><Icon size={14} aria-hidden="true" />{status}</span></span>
          <select aria-label={`${label}的檢查規則`} className={`${input} bg-card text-foreground ${mode === "forbidden" ? "border-destructive font-medium" : mode === "required" ? "border-primary font-medium" : ""}`} value={mode} onChange={(event) => setRule(feature, event.target.value as SpecialRuleCheck["mode"] | "none")}><option value="none">不檢查</option><option value="required">必須使用</option><option value="forbidden">禁止使用</option></select>
        </label>
      })}
    </div>
    {errors.specialRuleChecks && <p role="alert" className="mt-3 text-sm text-destructive">{errors.specialRuleChecks}</p>}
    {legacy.length > 0 && <details className="mt-5 rounded-lg border border-border p-4 text-sm"><summary className="cursor-pointer text-muted-foreground">舊版自訂文字規則（{legacy.length} 項，保留原設定）</summary><div className="mt-3 space-y-2">{legacy.map((rule) => <label className="flex min-h-11 items-center gap-2" key={rule.id}><input type="checkbox" checked onChange={() => onChange({ ...draft, specialRuleIds: draft.specialRuleIds.filter((id) => id !== rule.id) })} /><span>{rule.name} · {rule.kind === "required" ? "必用" : "禁用"}</span></label>)}</div></details>}
  </section>
}
