import { useId, useState, type FormEvent } from "react"
import { Info, Save } from "lucide-react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router"
import { languages, type Language } from "../../types/assignment"
import type { Problem, ProblemDraft } from "../../types/problem"
import type { TestCase } from "../../types/testCase"
import { useProblems } from "../../hooks/problems/useProblems"
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges"
import { validateProblem, type FieldErrors } from "../../utils/problems/problemValidation"
import { FormField } from "../shared/FormField"
import { UnsavedChangesDialog } from "../shared/UnsavedChangesDialog"
import { button, card, input, outlineButton } from "../ui/styles"
import { GradingSettings } from "./GradingSettings"
import { ProblemStatementEditor, statementTemplate } from "./ProblemStatementEditor"
import { TestCaseManager } from "./TestCaseManager"
import { PublicProblemContent } from "./PublicProblemContent"
import { publicProblemView } from "../../utils/problems/problemPresentation"
import { ProblemCodeChecks } from "./ProblemCodeChecks"
import { ProblemSpecialRules } from "./ProblemSpecialRules"
import { mergeProblemTab, problemTabDirty } from "../../utils/problems/problemEditor"
import { applyProblemAction, type ProblemAction } from "../../utils/problems/problemOperations"

export function ProblemForm({ problem }: { problem?: Problem }) {
  const { data, execute } = useProblems()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const requestedTab = searchParams.get("tab") ?? (location.hash === "#testcases" ? "testcases" : location.hash === "#grading" ? "basic" : problem ? "overview" : "basic")
  const tab = ["overview", "basic", "statement", "testcases", "special-rules"].includes(requestedTab) ? requestedTab : "overview"
  function setTab(value: string) {
    const params = new URLSearchParams(searchParams)
    params.set("tab", value)
    navigate({ pathname: location.pathname, search: `?${params}`, hash: "" }, { replace: true })
  }
  const [baseline, setBaseline] = useState<ProblemDraft>(() => problem ? { code: problem.code, difficulty: problem.difficulty, tags: problem.tags, title: problem.title, statementMarkdown: problem.statementMarkdown, points: problem.points, timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb, outputComparisonMode: problem.outputComparisonMode, allowedLanguages: problem.allowedLanguages, similarityCheck: problem.similarityCheck, specialRuleIds: problem.specialRuleIds, specialRuleChecks: problem.specialRuleChecks } : { code: "", difficulty: "easy", tags: [], title: "", statementMarkdown: statementTemplate, points: 100, timeLimitMs: 1000, memoryLimitMb: 256, outputComparisonMode: "strict", allowedLanguages: ["Python 3"], similarityCheck: { enabled: false, threshold: 80 }, specialRuleIds: [], specialRuleChecks: [] })
  const [draft, setDraft] = useState(baseline)
  const [tagsText, setTagsText] = useState(baseline.tags.join(", "))
  const [errors, setErrors] = useState<FieldErrors<ProblemDraft>>({})
  const [error, setError] = useState("")
  const [caseBaseline, setCaseBaseline] = useState(() => data.testCases.filter((item) => item.problemId === problem?.id).sort((a, b) => a.order - b.order))
  const [caseDraft, setCaseDraft] = useState(caseBaseline)
  const formId = useId()
  const draftDirty = JSON.stringify(draft) !== JSON.stringify(baseline)
  const casesDirty = JSON.stringify(caseDraft) !== JSON.stringify(caseBaseline)
  const currentDirty = tab === "testcases" ? casesDirty : problemTabDirty(tab, draft, baseline)
  const referenceCount = problem ? data.assignmentProblems.filter((item) => item.problemId === problem.id).length : 0
  const guard = useUnsavedChanges(draftDirty || casesDirty, { includeSearch: true })
  function update(value: ProblemDraft) { guard.markDirty(); setDraft(value) }
  function updateCases(cases: TestCase[]) { guard.markDirty(); setCaseDraft(cases) }
  function previewCases(action: ProblemAction) {
    const source = { ...data, testCases: [...data.testCases.filter((item) => item.problemId !== problem?.id), ...caseDraft] }
    return applyProblemAction(source, action).data.testCases.filter((item) => item.problemId === problem?.id).sort((a, b) => a.order - b.order)
  }
  function stageCases(action: ProblemAction) { const cases = previewCases(action); guard.markDirty(); setCaseDraft(cases) }
  function saveTab(): string | undefined {
    try {
      if (tab === "testcases" && problem) {
        const cases = caseDraft.map((item, order) => ({ ...item, name: item.name.trim(), order }))
        execute({ type: "save-testcases", problemId: problem.id, cases }, "測資管理已儲存。")
        setCaseBaseline(cases); setCaseDraft(cases)
        guard.markSaved(); setError("")
        return problem.id
      }
      const merged = problem ? mergeProblemTab(tab, draft, problem) : draft
      const nextErrors = validateProblem(merged, data.problems, problem?.id)
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length) { setError(Object.values(nextErrors).join(" ")); return }
      const id = execute({ type: "save-problem", id: problem?.id, draft: merged }, "此分頁的修改已儲存。")
      const saved = { ...merged, code: merged.code.trim(), title: merged.title.trim(), tags: [...new Set(merged.tags.map((tag) => tag.trim()).filter(Boolean))] }
      setBaseline(saved); setDraft(saved); setTagsText(saved.tags.join(", "))
      guard.markSaved(); setError("")
      return id
    } catch (error) { setError(error instanceof Error ? error.message : "儲存失敗。") }
  }
  function save(event: FormEvent) {
    event.preventDefault()
    if (!currentDirty) return
    const id = saveTab()
    if (id && !problem) navigate(`/problems/${id}/edit?tab=${tab}`, { replace: true })
  }
  function saveAndContinue() {
    if (guard.blocker.state !== "blocked") return
    const id = saveTab()
    if (!id) return
    if (!problem && guard.blocker.location.pathname === location.pathname) {
      const next = guard.blocker.location
      guard.blocker.reset()
      navigate(`/problems/${id}/edit${next.search}${next.hash}`, { replace: true })
    } else guard.blocker.proceed()
  }
  function discardTab() {
    setDraft(mergeProblemTab(tab, baseline, draft))
    if (tab === "basic") setTagsText(baseline.tags.join(", "))
    if (tab === "testcases") setCaseDraft(caseBaseline)
    setErrors({}); setError(""); guard.markSaved()
  }
  return <div className="space-y-4">
    <form id={formId} onSubmit={save} noValidate className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border pb-3">
        <nav aria-label="題目編輯分頁" className="flex flex-wrap gap-1">
          {[["overview", "總覽"], ["basic", "題目基本訊息"], ["statement", "題目說明"], ["testcases", "測資管理"], ["special-rules", "特殊規則檢查"]].map(([key, label]) => <button type="button" key={key} aria-pressed={tab === key} disabled={!problem && key !== "basic" && key !== "overview"} title={!problem && key !== "basic" && key !== "overview" ? "請先儲存題目基本訊息" : undefined} className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40 ${tab === key ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} onClick={() => setTab(key)}>{label}</button>)}
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          {referenceCount > 0 && <details className="relative">
            <summary aria-label={`已被 ${referenceCount} 份作業引用，查看修改影響`} className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"><Info size={15} />已引用 {referenceCount}</summary>
            <div className="absolute top-full right-0 z-20 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-lg border border-border bg-card p-4 text-sm leading-6 text-foreground shadow-lg">修改會更新題庫及草稿作業；已發布作業保留發布時的版本。已封存且曾發布的作業也保留原快照。</div>
          </details>}
          <Link className={outlineButton} to="/problems">返回題庫</Link>
          <button type="submit" disabled={!currentDirty} className={currentDirty ? button : `${outlineButton} cursor-not-allowed bg-muted! text-muted-foreground`}><Save size={16} />儲存修改</button>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {tab === "overview" && <PublicProblemContent embedded problem={publicProblemView({ ...draft, id: problem?.id }, caseDraft)} />}
      {tab === "basic" && <section className={`${card} space-y-6`}>
        <h2 className="text-base font-semibold">題目基本訊息</h2>
        <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)] lg:grid-cols-[10rem_10rem_minmax(0,1fr)]">
          <FormField label="題目編號" required error={errors.code}>{(id, description) => <input id={id} className={input} required value={draft.code} aria-invalid={!!errors.code} aria-describedby={description} onChange={(event) => update({ ...draft, code: event.target.value })} />}</FormField>
          <div className="min-w-0 lg:col-span-2"><FormField label="題目名稱" required error={errors.title}>{(id, description) => <input id={id} className={input} required value={draft.title} aria-invalid={!!errors.title} aria-describedby={description} onChange={(event) => update({ ...draft, title: event.target.value })} />}</FormField></div>
          <FormField label="允許語言" required error={errors.allowedLanguages ?? (draft.allowedLanguages.length > 1 ? "原設定包含多種語言，請重新選擇一種。" : undefined)}>{(id, description) => <select id={id} required className={input} value={draft.allowedLanguages.length === 1 ? draft.allowedLanguages[0] : ""} aria-invalid={!!errors.allowedLanguages || draft.allowedLanguages.length > 1} aria-describedby={description} onChange={(event) => update({ ...draft, allowedLanguages: event.target.value ? [event.target.value as Language] : [] })}><option value="" disabled>請選擇一種語言</option>{languages.map((language) => <option value={language} key={language}>{language}</option>)}</select>}</FormField>
          <FormField label="難度" required error={errors.difficulty}>{(id) => <select id={id} value={draft.difficulty} className={input} onChange={(event) => update({ ...draft, difficulty: event.target.value as ProblemDraft["difficulty"] })}><option value="easy">簡單</option><option value="medium">中等</option><option value="hard">困難</option></select>}</FormField>
          <div className="min-w-0 sm:col-span-2 lg:col-span-1"><FormField label="分類標籤（以逗號分隔）" error={errors.tags}>{(id) => <input id={id} value={tagsText} className={input} placeholder="例如：迴圈、串列" onChange={(event) => { setTagsText(event.target.value); update({ ...draft, tags: event.target.value.split(/[,，、]/).map((tag) => tag.trim()).filter(Boolean) }) }} />}</FormField></div>
        </div>
        <div className="space-y-4 border-t border-border pt-5">
          <h3 className="text-sm font-semibold">執行與評分</h3>
          <GradingSettings draft={draft} onChange={update} errors={errors} readOnly={false} />
          <ProblemCodeChecks draft={draft} onChange={update} errors={errors} />
        </div>
      </section>}
      {tab === "statement" && <section className={card}><p className="mb-3 text-xs text-muted-foreground">公開範例由「測資管理」自動帶入總覽。</p><ProblemStatementEditor value={draft.statementMarkdown} onChange={(value) => update({ ...draft, statementMarkdown: value })} readOnly={false} error={errors.statementMarkdown} /></section>}
      {tab === "special-rules" && <ProblemSpecialRules draft={draft} onChange={update} errors={errors} />}
    </form>
    {tab === "testcases" && <section>{problem ? <TestCaseManager problem={problem} cases={caseDraft} onAction={stageCases} onChange={updateCases} /> : <div className={card}><p className="text-sm text-muted-foreground">請先填寫題目基本訊息並儲存，再新增測資。</p></div>}</section>}
    <UnsavedChangesDialog blocker={guard.blocker} onSave={saveAndContinue} onDiscard={discardTab} error={error} />
  </div>
}
