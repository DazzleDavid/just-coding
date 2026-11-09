import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router"
import { ChevronDown } from "lucide-react"
import { useAssignments } from "../../hooks/assignments/useAssignments"
import type { Assignment } from "../../types/assignment"
import type { AssignmentAction } from "../../utils/assignments/assignmentOperations"
import { publishIssues } from "../../utils/assignments/assignmentValidation"
import { ConfirmDialog, FormDialog } from "../shared/ConfirmDialog"
import { button, outlineButton } from "../ui/styles"

export function AssignmentActions({
  assignment,
  disabled = false,
}: {
  assignment: Assignment
  disabled?: boolean
}) {
  const { data, execute } = useAssignments()
  const navigate = useNavigate()
  const menu = useRef<HTMLDetailsElement>(null)
  const [pending, setPending] = useState<{
    title: string
    action: AssignmentAction
    danger?: boolean
  } | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState("")
  const issues = publishIssues(
    assignment,
    data.assignments,
    data.problems,
    data.testCases,
    data.assignmentProblems,
  )

  function closeMenu() {
    if (menu.current) menu.current.open = false
    setError("")
  }
  function perform(action: AssignmentAction) {
    if (disabled) return
    try {
      const id = execute(
        action,
        action.type === "delete-assignment" ? "作業已刪除。" : "作業已更新。",
      )
      setPending(null)
      setError("")
      if (action.type === "copy-assignment") navigate(`/assignments/${id}`)
      if (action.type === "delete-assignment") navigate("/assignments")
    } catch (error) {
      setError(error instanceof Error ? error.message : "操作失敗。")
    }
  }
  function confirm(title: string, action: AssignmentAction, danger = false) {
    closeMenu()
    setPending({ title, action, danger })
  }
  return (
    <div title={disabled ? "請先儲存或還原修改，再進行其他操作。" : undefined}>
      <div className="flex items-center gap-2">
        {assignment.status === "draft" && (
          <button
            type="button"
            className={button}
            disabled={disabled}
            onClick={() => {
              setError("")
              setChecking(true)
            }}
          >
            檢查並發布
          </button>
        )}
        <details
          ref={menu}
          className="group relative"
        >
          <summary
            className={`${outlineButton} list-none [&::-webkit-details-marker]:hidden ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            aria-disabled={disabled}
            onClick={(event) => {
              if (disabled) event.preventDefault()
            }}
          >
            其他操作
            <ChevronDown size={15} />
          </summary>
          <div className="absolute right-0 z-20 mt-2 flex min-w-44 flex-col rounded-lg border border-border bg-card p-1 text-sm shadow-lg">
            <button
              type="button"
              className="rounded px-4 py-3 text-left hover:bg-accent disabled:opacity-50"
              disabled={disabled}
              onClick={() => {
                closeMenu()
                perform({ type: "copy-assignment", id: assignment.id })
              }}
            >
              複製作業
            </button>
            {assignment.status !== "draft" && (
              <button
                type="button"
                className="rounded px-4 py-3 text-left hover:bg-accent disabled:opacity-50"
                disabled={disabled}
                onClick={() =>
                  confirm(
                    assignment.status === "published" ? "取消發布" : "還原為草稿",
                    { type: "status", id: assignment.id, status: "draft" },
                    assignment.status === "published",
                  )
                }
              >
                {assignment.status === "published" ? "取消發布" : "還原為草稿"}
              </button>
            )}
            {assignment.status !== "archived" && (
              <button
                type="button"
                className="rounded px-4 py-3 text-left hover:bg-accent disabled:opacity-50"
                disabled={disabled}
                onClick={() =>
                  confirm("封存作業", { type: "status", id: assignment.id, status: "archived" })
                }
              >
                封存作業
              </button>
            )}
            <button
              type="button"
              className="rounded px-4 py-3 text-left text-destructive hover:bg-destructive/10 disabled:opacity-50"
              disabled={disabled}
              onClick={() =>
                confirm("刪除作業", { type: "delete-assignment", id: assignment.id }, true)
              }
            >
              刪除作業
            </button>
          </div>
        </details>
      </div>
      {error && !pending && !checking && (
        <p
          role="alert"
          className="mt-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {pending && (
        <ConfirmDialog
          title={pending.title}
          danger={pending.danger}
          onCancel={() => {
            setPending(null)
            setError("")
          }}
          onConfirm={() => perform(pending.action)}
        >
          確定要{pending.title}「{assignment.title}」嗎？
          {pending.action.type === "delete-assignment" &&
            "作業及題目配置會刪除，題庫與測資會保留。"}
          {pending.action.type === "status" &&
            pending.action.status === "draft" &&
            "還原後可修改題目與配分，再次發布將使用當時的題庫內容。"}
          {error && (
            <p
              role="alert"
              className="text-destructive"
            >
              {error}
            </p>
          )}
        </ConfirmDialog>
      )}
      {checking && (
        <FormDialog
          compact
          title="發布前檢查"
          onClose={() => {
            setChecking(false)
            setError("")
          }}
        >
          {issues.length ? (
            <>
              <p className="mb-4 text-sm">請先修正以下項目：</p>
              <ul className="space-y-3">
                {issues.map((issue, index) => (
                  <li key={index}>
                    <Link
                      className="text-sm text-destructive underline underline-offset-4"
                      to={issue.path}
                      onClick={() => setChecking(false)}
                    >
                      {issue.message}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="text-sm">檢查已通過，確認發布「{assignment.title}」？</p>
              <button
                type="button"
                className={`${button} mt-5`}
                disabled={disabled}
                onClick={() => {
                  try {
                    execute(
                      { type: "status", id: assignment.id, status: "published" },
                      "作業已發布。",
                    )
                    setChecking(false)
                  } catch (error) {
                    setError(error instanceof Error ? error.message : "發布失敗。")
                  }
                }}
              >
                確認發布
              </button>
            </>
          )}
          {error && (
            <p
              role="alert"
              className="mt-4 text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </FormDialog>
      )}
    </div>
  )
}
