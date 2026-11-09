import { GradeDataNotice } from "../../components/grades/GradeDataNotice"
import { SubmissionGradeList } from "../../components/grades/SubmissionGradeList"

export function SubmissionListPage() {
  return (
    <div className="space-y-5 p-4 sm:p-6">
      <GradeDataNotice />
      <SubmissionGradeList />
    </div>
  )
}
