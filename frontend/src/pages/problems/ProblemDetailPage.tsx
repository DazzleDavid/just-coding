import { Link, useParams } from "react-router"
import { useProblems } from "../../hooks/problems/useProblems"
import { PublicProblemContent } from "../../components/problems/PublicProblemContent"
import { EmptyState } from "../../components/shared/EmptyState"
import { outlineButton } from "../../components/ui/styles"
import { publicProblemView } from "../../utils/problems/problemPresentation"

export function ProblemDetailPage() {
  const { problemId } = useParams()
  const { data } = useProblems()
  const problem = data.problems.find((item) => item.id === problemId)
  if (!problem)
    return (
      <EmptyState title="找不到題目">
        <Link
          to="/problems"
          className={outlineButton}
        >
          返回題庫
        </Link>
      </EmptyState>
    )
  return (
    <div className="space-y-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          className={outlineButton}
          to={`/problems/${problem.id}/edit`}
        >
          編輯題目
        </Link>
      </div>
      <PublicProblemContent
        embedded
        problem={publicProblemView(problem, data.testCases)}
      />
    </div>
  )
}
