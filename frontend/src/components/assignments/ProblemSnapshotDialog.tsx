import type { AssignmentProblem } from "../../types/assignmentProblem"
import { FormDialog } from "../shared/ConfirmDialog"
import { MarkdownPreview } from "../problems/MarkdownPreview"
import { formatDate } from "../../utils/assignments/gradingUtils"
import { specialRuleCatalog } from "../../data/problems/specialRuleCatalog"

export function ProblemSnapshotDialog({
  relation,
  onClose,
}: {
  relation: AssignmentProblem
  onClose: () => void
}) {
  const snapshot = relation.publishedSnapshot
  if (!snapshot) return null
  return (
    <FormDialog
      title={`發布內容 · ${snapshot.problem.code} ${snapshot.problem.title}`}
      description="此內容固定於發布時，不受目前題庫修改影響。"
      onClose={onClose}
    >
      <dl className="mb-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">發布時間</dt>
          <dd className="mt-1">{formatDate(snapshot.capturedAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">作業內配分</dt>
          <dd className="mt-1">{relation.points} 分</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">限制與比較規則</dt>
          <dd className="mt-1">
            {snapshot.problem.timeLimitMs} ms / {snapshot.problem.memoryLimitMb} MB ·{" "}
            {snapshot.problem.outputComparisonMode}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">支援語言</dt>
          <dd className="mt-1">{snapshot.problem.allowedLanguages.join("、")}</dd>
        </div>
      </dl>
      <MarkdownPreview value={snapshot.problem.statementMarkdown} />
      <div className="mt-5 rounded-lg border border-border p-4 text-sm leading-7">
        <p>
          程式碼相似度：
          {snapshot.problem.similarityCheck.enabled
            ? `啟用，門檻 ${snapshot.problem.similarityCheck.threshold}%`
            : "停用"}
        </p>
        <p>
          特殊規則：
          {snapshot.problem.specialRuleChecks
            .map(
              (check) =>
                `${specialRuleCatalog.find((item) => item.feature === check.feature)?.label}（${check.mode === "required" ? "必用" : "禁用"}）`,
            )
            .join("、") || "未設定"}
        </p>
        {snapshot.specialRules.length > 0 && (
          <p>舊版自訂規則：{snapshot.specialRules.map((rule) => rule.name).join("、")}</p>
        )}
      </div>
      <h3 className="mt-6 mb-3 font-semibold">發布測資（{snapshot.testCases.length} 筆）</h3>
      <div className="space-y-3">
        {snapshot.testCases.map((item) => (
          <details
            key={item.id}
            className="rounded-lg border border-border p-4"
          >
            <summary className="cursor-pointer text-sm">
              {item.name} · {item.visibility === "public" ? "公開" : "隱藏"} ·{" "}
              {item.enabled ? "啟用" : "停用"}
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Input</p>
                <pre className="overflow-x-auto rounded bg-muted p-3 text-sm whitespace-pre">
                  {item.input || "（空輸入）"}
                </pre>
              </div>
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Expected Output</p>
                <pre className="overflow-x-auto rounded bg-muted p-3 text-sm whitespace-pre">
                  {item.expectedOutput || "（空輸出）"}
                </pre>
              </div>
            </div>
          </details>
        ))}
      </div>
    </FormDialog>
  )
}
