import type { PublicProblemView } from "../../utils/problems/problemPresentation"
import { MarkdownPreview } from "./MarkdownPreview"
import { card } from "../ui/styles"

export function PublicProblemContent({ problem, embedded = false }: { problem: PublicProblemView; embedded?: boolean }) {
  const Heading = embedded ? "h2" : "h1"
  return <div className="space-y-6">
    <header className={card}>
      <p className="mb-2 font-mono text-sm text-primary">{problem.code || "題目編號"}</p>
      <Heading className="text-2xl font-bold tracking-tight">{problem.title || "尚未命名的題目"}</Heading>
      <dl className="mt-5 grid gap-4 border-t border-border pt-5 text-sm sm:grid-cols-2 xl:grid-cols-4">
        {[["預設配分", `${problem.points} 分`], ["時間限制", `${problem.timeLimitMs} ms`], ["記憶體限制", `${problem.memoryLimitMb} MB`], ["允許語言", problem.allowedLanguages.join("、") || "尚未設定"]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}
      </dl>
    </header>
    {(problem.specialRules.required.length > 0 || problem.specialRules.forbidden.length > 0) && <section className="rounded-lg border border-border bg-card px-4 py-3" aria-label="特殊規則">
      <h2 className="text-sm font-semibold">特殊規則</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
        {(["required", "forbidden"] as const).map((mode) => {
          const rules = problem.specialRules[mode]
          if (!rules.length) return null
          return <li key={mode}><span className={`font-semibold ${mode === "required" ? "text-primary" : "text-destructive"}`}>{mode === "required" ? "必須使用" : "禁止使用"}：</span>{rules.join("、")}</li>
        })}
      </ul>
    </section>}
    <section aria-label="題目說明"><MarkdownPreview value={problem.statementMarkdown} /></section>
    <section className={card} aria-labelledby="public-examples-title">
      <h2 id="public-examples-title" className="text-lg font-semibold">範例</h2>
      {problem.examples.length ? <div className="mt-5 space-y-6">{problem.examples.map((example, index) => <article key={index} className="space-y-3">
        <h3 className="text-sm font-semibold">範例 {index + 1}</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <div><p className="mb-2 text-sm text-muted-foreground">輸入 Input</p><pre className="min-h-24 overflow-x-auto rounded-lg border border-border bg-background p-4 font-mono text-sm leading-6 whitespace-pre">{example.input || <span className="font-sans text-muted-foreground">（空輸入）</span>}</pre></div>
          <div><p className="mb-2 text-sm text-muted-foreground">輸出 Output</p><pre className="min-h-24 overflow-x-auto rounded-lg border border-border bg-background p-4 font-mono text-sm leading-6 whitespace-pre">{example.expectedOutput || <span className="font-sans text-muted-foreground">（空輸出）</span>}</pre></div>
        </div>
      </article>)}</div> : <p className="mt-4 text-sm text-muted-foreground">此題目前沒有公開範例測資。</p>}
    </section>
  </div>
}
