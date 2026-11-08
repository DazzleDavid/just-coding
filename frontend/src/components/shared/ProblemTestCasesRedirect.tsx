import { Navigate, useParams } from "react-router"

export function ProblemTestCasesRedirect() {
  const { problemId } = useParams()
  return <Navigate to={`/problems/${problemId}/edit#testcases`} replace />
}

export function ProblemGradingRedirect() {
  const { problemId } = useParams()
  return <Navigate to={`/problems/${problemId}/edit#grading`} replace />
}
