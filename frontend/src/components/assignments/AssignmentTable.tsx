import { Link } from "react-router"
import type { Assignment } from "../../types/assignment"
import { useAssignments } from "../../hooks/assignments/useAssignments"
import { assignmentDisplayStatus, formatDate } from "../../utils/assignments/gradingUtils"
import { StatusBadge } from "../shared/StatusBadge"
import { tableCell, outlineButton } from "../ui/styles"

export function AssignmentTable({
  assignments,
  offset,
}: {
  assignments: Assignment[]
  offset: number
}) {
  const { data } = useAssignments()
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1200px] table-fixed border-collapse">
        <colgroup>
          {[6, 11, 23, 8, 16, 16, 10, 10].map((width, index) => (
            <col
              key={index}
              style={{ width: `${width}%` }}
            />
          ))}
        </colgroup>
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            {["序號", "作業編號", "作業名稱", "題目數", "開放時間", "截止時間", "狀態", "操作"].map(
              (label) => (
                <th
                  scope="col"
                  key={label}
                  className={`${tableCell} font-medium`}
                >
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {assignments.map((assignment, index) => (
            <tr
              key={assignment.id}
              className="border-t border-border hover:bg-accent/30"
            >
              <td className={tableCell}>{offset + index + 1}</td>
              <td className={`${tableCell} font-mono`}>{assignment.code}</td>
              <td className={tableCell}>
                <Link
                  className="font-medium text-primary hover:underline"
                  to={`/assignments/${assignment.id}`}
                >
                  {assignment.title}
                </Link>
              </td>
              <td className={tableCell}>
                {
                  data.assignmentProblems.filter((item) => item.assignmentId === assignment.id)
                    .length
                }
              </td>
              <td className={tableCell}>{formatDate(assignment.startAt)}</td>
              <td className={tableCell}>{formatDate(assignment.dueAt)}</td>
              <td className={tableCell}>
                <StatusBadge label={assignmentDisplayStatus(assignment)} />
              </td>
              <td className={tableCell}>
                <Link
                  className={`${outlineButton} whitespace-nowrap`}
                  to={`/assignments/${assignment.id}`}
                >
                  管理作業
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
