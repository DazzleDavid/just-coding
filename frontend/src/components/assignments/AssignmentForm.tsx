import { Link, useNavigate } from "react-router"
import { useAssignmentEditor } from "../../hooks/assignments/useAssignmentEditor"
import { UnsavedChangesDialog } from "../shared/UnsavedChangesDialog"
import { button, card, outlineButton } from "../ui/styles"
import { AssignmentFields } from "./AssignmentFields"

export function AssignmentForm() {
  const editor = useAssignmentEditor()
  const navigate = useNavigate()
  return (
    <>
      <form
        noValidate
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          const id = editor.save()
          if (id) navigate(`/assignments/${id}#problems`)
        }}
      >
        <section className={card}>
          <h2 className="mb-4 font-semibold">作業資訊</h2>
          <AssignmentFields
            draft={editor.draft}
            status="draft"
            errors={editor.errors}
            onChange={editor.updateDraft}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            時間使用目前裝置的時區。建立後可加入題目並設定配分。
          </p>
        </section>
        {editor.failure && (
          <p
            role="alert"
            className="text-sm text-destructive"
          >
            {editor.failure}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            className={outlineButton}
            to="/assignments"
          >
            取消
          </Link>
          <button
            type="submit"
            className={button}
          >
            建立並配置題目
          </button>
        </div>
      </form>
      <UnsavedChangesDialog blocker={editor.guard.blocker} />
    </>
  )
}
