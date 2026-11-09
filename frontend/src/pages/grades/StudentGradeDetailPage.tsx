import { Link, useLocation, useParams } from "react-router"
import { useGrades } from "../../hooks/grades/useGrades"
import { useGradeFilters } from "../../hooks/grades/useGradeFilters"
import { GradeStats } from "../../components/grades/GradeUI"
import { rateText } from "../../utils/grades/gradeFormat"
import { StudentAssignmentGrades } from "../../components/grades/StudentAssignmentGrades"
import { EmptyState } from "../../components/shared/EmptyState"
import { outlineButton } from "../../components/ui/styles"

export function StudentGradeDetailPage() {
  const { studentId } = useParams()
  const filters = useGradeFilters()
  const { book } = useGrades()
  const location = useLocation()
  const summary = book.students.find((item) => item.student.id === studentId)
  if (!summary)
    return (
      <EmptyState
        title="找不到學生"
        description="此學生不存在或已移除。"
      >
        <Link
          className={outlineButton}
          to="/grades/students"
        >
          返回學生成績
        </Link>
      </EmptyState>
    )
  const { student } = summary
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          className="text-primary hover:underline"
          to={`/grades/students${location.search.replace(/([?&])expand=[^&]*&?/, "$1").replace(/[?&]$/, "")}`}
        >
          返回學生成績
        </Link>
        <p>
          {student.studentNumber} · {student.name} · {student.className || "未設定班級"} ·{" "}
          {student.active ? "帳號啟用" : "帳號停用"}
        </p>
      </div>
      <GradeStats
        items={[
          {
            label: "作業總數",
            value: summary.assignments.length,
          },
          { label: "已開始繳交作業", value: summary.started },
          { label: "已提交題數", value: summary.submitted },
          { label: "已完成題數", value: summary.completed },
          { label: "有效提交總次數", value: summary.submissionCount },
        ]}
      />
      <p className="text-sm text-muted-foreground">
        平均得分率 {rateText(summary.averageRate)} · 樣本 {summary.sampleSize}{" "}
        份作業。點選作業與題目可展開歷次提交。
      </p>
      <StudentAssignmentGrades
        rows={summary.assignments}
        expanded={filters.value("expand")}
      />
      {!summary.assignments.length && (
        <EmptyState
          title="尚無作業"
          description="請先至作業管理建立作業。"
        />
      )}
    </div>
  )
}
