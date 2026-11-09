import { Navigate, useParams } from "react-router"
import { useAssignments } from "../../hooks/assignments/useAssignments"
import { AssignmentForm } from "../../components/assignments/AssignmentForm"

export function AssignmentFormPage() {
  const { assignmentId } = useParams()
  const { loadError } = useAssignments()
  if (assignmentId)
    return (
      <Navigate
        to={`/assignments/${assignmentId}`}
        replace
      />
    )
  return (
    <div className="space-y-5 p-4 sm:p-6">
      {loadError && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {loadError}
        </p>
      )}
      <AssignmentForm />
    </div>
  )
}
