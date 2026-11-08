import type { Blocker } from "react-router"
import { ConfirmDialog, FormDialog } from "./ConfirmDialog"
import { button, outlineButton } from "../ui/styles"

export function UnsavedChangesDialog({ blocker, onSave, onDiscard, error }: { blocker: Blocker; onSave?: () => void; onDiscard?: () => void; error?: string }) {
  if (blocker.state !== "blocked") return null
  if (!onSave) return <ConfirmDialog title="尚有未儲存的修改" danger onCancel={() => blocker.reset()} onConfirm={() => blocker.proceed()}>離開後會捨棄本次未儲存的內容，確定離開嗎？</ConfirmDialog>
  return <FormDialog compact title="是否儲存此分頁的修改？" description="此分頁有未儲存的內容，請選擇儲存後繼續，或不儲存並捨棄修改。" onClose={() => blocker.reset()}>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="mt-5 flex flex-wrap justify-end gap-2">
      <button type="button" className={outlineButton} onClick={() => blocker.reset()}>繼續編輯</button>
      <button type="button" className={`${outlineButton} text-destructive`} onClick={() => { onDiscard?.(); blocker.proceed() }}>不儲存</button>
      <button type="button" className={button} onClick={onSave}>儲存並繼續</button>
    </div>
  </FormDialog>
}
