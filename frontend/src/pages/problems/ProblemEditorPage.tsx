import { Link, useParams } from "react-router"
import { useProblems } from "../../hooks/problems/useProblems"
import { ProblemForm } from "../../components/problems/ProblemForm"
import { EmptyState } from "../../components/shared/EmptyState"
import { outlineButton } from "../../components/ui/styles"

export function ProblemEditorPage() {
  const { problemId } = useParams()
  const { data, loadError } = useProblems()
  const problem = data.problems.find((item) => item.id === problemId)
  if (problemId && !problem)
    return (
      <EmptyState
        title="找不到題目"
        description={loadError}
      >
        <Link
          to="/problems"
          className={outlineButton}
        >
          返回題庫
        </Link>
      </EmptyState>
    )
  return (
    <div className="space-y-4 p-6 sm:p-8">
      {loadError && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {loadError}
        </p>
      )}
      <ProblemForm
        key={problemId ?? "new"}
        problem={problem}
      />
    </div>
  )
}
