import { useEffect, useRef } from "react"
import { Link, useLocation, useParams } from "react-router"
import type { Assignment } from "../../types/assignment"
import { useAssignments } from "../../hooks/assignments/useAssignments"
import { useAssignmentEditor } from "../../hooks/assignments/useAssignmentEditor"
import { AssignmentActions } from "../../components/assignments/AssignmentActions"
import { AssignmentFields } from "../../components/assignments/AssignmentFields"
import { AssignmentProblemList } from "../../components/assignments/AssignmentProblemList"
import { EmptyState } from "../../components/shared/EmptyState"
import { FormDialog } from "../../components/shared/ConfirmDialog"
import { UnsavedChangesDialog } from "../../components/shared/UnsavedChangesDialog"
import { StatusBadge } from "../../components/shared/StatusBadge"
import { assignmentDisplayStatus, formatDate } from "../../utils/assignments/gradingUtils"
import { button, card, dangerButton, outlineButton } from "../../components/ui/styles"

export function AssignmentDetailPage() {
  const { assignmentId } = useParams()
  const { data, loadError } = useAssignments()
  const assignment = data.assignments.find((item) => item.id === assignmentId)
  if (!assignment)
    return (
      <EmptyState
        title="找不到作業"
        description={loadError || "此作業不存在。"}
      >
        <Link
          to="/assignments"
          className={outlineButton}
        >
          返回所有作業
        </Link>
      </EmptyState>
    )
  return (
    <AssignmentWorkspace
      key={`${assignment.id}-${assignment.status}`}
      assignment={assignment}
    />
  )
}

function AssignmentWorkspace({ assignment }: { assignment: Assignment }) {
  const editor = useAssignmentEditor(assignment)
  const location = useLocation()
  const information = useRef<HTMLFormElement>(null)
  const problems = useRef<HTMLDivElement>(null)
  const archived = assignment.status === "archived"
  useEffect(() => {
    const target =
      location.hash === "#problems"
        ? problems
        : location.hash === "#information"
          ? information
          : null
    target?.current?.scrollIntoView({ block: "start" })
  }, [location.hash])
  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge label={assignmentDisplayStatus(assignment)} />
          {editor.dirty && <span className="text-xs text-muted-foreground">有未儲存的修改</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!archived && (
            <>
              {editor.dirty && (
                <button
                  type="button"
                  className={outlineButton}
                  onClick={editor.discard}
                >
                  還原修改
                </button>
              )}
              <button
                type="submit"
                form="assignment-information"
                className={
                  editor.dirty ? button : `${outlineButton} bg-muted! text-muted-foreground`
                }
                disabled={!editor.dirty}
              >
                儲存修改
              </button>
            </>
          )}
          <AssignmentActions
            assignment={assignment}
            disabled={editor.dirty}
          />
        </div>
      </div>
      {editor.failure && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {editor.failure}
        </p>
      )}
      <form
        ref={information}
        id="assignment-information"
        noValidate
        className={`${card} scroll-mt-28`}
        onSubmit={(event) => {
          event.preventDefault()
          if (!archived && editor.dirty) editor.save()
        }}
      >
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">作業資訊</h2>
          <p className="text-xs text-muted-foreground">
            {archived
              ? "已封存，內容為唯讀。"
              : assignment.status === "published"
                ? "可修改名稱、說明及截止時間；題目與配分已固定。"
                : "修改後統一儲存；時間使用目前裝置的時區。"}
          </p>
        </div>
        <AssignmentFields
          draft={editor.draft}
          status={assignment.status}
          errors={editor.errors}
          onChange={editor.updateDraft}
        />
      </form>
      <div
        ref={problems}
        className="scroll-mt-28"
      >
        <AssignmentProblemList
          assignment={assignment}
          items={editor.problems}
          onChange={editor.updateProblems}
        />
      </div>
      <UnsavedChangesDialog blocker={editor.guard.blocker} />
      {editor.pendingDeadline?.deadlineConfirmation && (
        <FormDialog
          compact
          title="確認縮短截止時間？"
          description="作業將提早停止接受繳交，確認後會一併儲存本次修改。"
          onClose={() => editor.setPendingDeadline(null)}
        >
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">原截止時間（台北）</dt>
              <dd className="mt-1">
                {formatDate(editor.pendingDeadline.deadlineConfirmation.previousDueAt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">新截止時間（台北）</dt>
              <dd className="mt-1 font-medium text-destructive">
                {formatDate(editor.pendingDeadline.draft.dueAt)}
              </dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={outlineButton}
              onClick={() => editor.setPendingDeadline(null)}
            >
              繼續編輯
            </button>
            <button
              type="button"
              className={dangerButton}
              onClick={editor.confirmDeadline}
            >
              確認縮短並儲存
            </button>
          </div>
        </FormDialog>
      )}
    </div>
  )
}
