import { Navigate, useLocation, useParams } from "react-router"
import { useAssignments } from "../../hooks/assignments/useAssignments"
import { EmptyState } from "./EmptyState"
import { Link } from "react-router"
import { outlineButton } from "../ui/styles"

export function LegacyProblemRedirect() {
  const { assignmentId, problemId } = useParams()
  const { data } = useAssignments()
  const location = useLocation()
  if (!problemId) return <Navigate to={`/assignments/${assignmentId}#problems`} replace />
  const belongs = data.assignmentProblems.some((item) => item.assignmentId === assignmentId && item.problemId === problemId)
  if (!belongs) return <EmptyState title="找不到原作業的題目"><Link to="/problems" className={outlineButton}>返回題庫</Link></EmptyState>
  const section = location.pathname.endsWith("/testcases") ? "testcases" : location.pathname.endsWith("/details") ? "details" : "edit"
  return <Navigate to={`/problems/${problemId}/${section}`} replace />
}
