import { useContext } from "react"
import { GradeContext } from "../../hooks/grades/useGrades"
import { GradeDataNotice } from "../../components/grades/GradeDataNotice"
import { GradeExportPanel } from "../../components/exports/GradeExportPanel"

export function GradeExportPage() {
  const source = useContext(GradeContext)
  const sourceKey = source?.demo ? `demo-${source.data.submissions[0]?.id ?? "empty"}` : "live"
  return (
    <div className="space-y-5 p-4 sm:p-6">
      <GradeDataNotice />
      <GradeExportPanel key={sourceKey} />
    </div>
  )
}
