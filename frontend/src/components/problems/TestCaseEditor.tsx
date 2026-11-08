import type { ReactNode } from "react"
import type { TestCase } from "../../types/testCase"
import { validateTestCase } from "../../utils/problems/problemValidation"
import { FormField } from "../shared/FormField"
import { card, input } from "../ui/styles"

export function TestCaseEditor({ testCase, onChange, children }: { testCase: TestCase; onChange: (value: TestCase) => void; children: ReactNode }) {
  const errors = validateTestCase(testCase)
  return <article className={`${card} space-y-4`} aria-label={`測資 TC${String(testCase.order + 1).padStart(2, "0")}`}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-mono text-base font-semibold">TC{String(testCase.order + 1).padStart(2, "0")}<span className="ml-3 font-sans text-xs font-normal text-muted-foreground">{testCase.enabled ? "啟用中" : "已停用"}</span></h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="sm:col-span-2"><FormField label="測資名稱" required error={errors.name}>{(id, description) => <input id={id} className={input} value={testCase.name} aria-invalid={!!errors.name} aria-describedby={description} onChange={(event) => onChange({ ...testCase, name: event.target.value })} />}</FormField></div>
      <FormField label="測資類型" required error={errors.visibility}>{(id, description) => <select id={id} className={input} value={testCase.visibility} aria-invalid={!!errors.visibility} aria-describedby={description} onChange={(event) => onChange({ ...testCase, visibility: event.target.value as TestCase["visibility"] })}><option value="public">公開</option><option value="hidden">隱藏</option></select>}</FormField>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <FormField label="輸入 Input">{(id) => <textarea id={id} spellCheck={false} rows={5} wrap="off" className={`${input} resize-y font-mono leading-6 whitespace-pre`} value={testCase.input} onChange={(event) => onChange({ ...testCase, input: event.target.value })} />}</FormField>
      <FormField label="預期輸出 Expected Output">{(id) => <textarea id={id} spellCheck={false} rows={5} wrap="off" className={`${input} resize-y font-mono leading-6 whitespace-pre`} value={testCase.expectedOutput} onChange={(event) => onChange({ ...testCase, expectedOutput: event.target.value })} />}</FormField>
    </div>
  </article>
}
