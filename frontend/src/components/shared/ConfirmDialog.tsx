import { Dialog } from "@base-ui/react/dialog"
import type { ReactNode } from "react"
import { button, dangerButton, outlineButton } from "../ui/styles"

export function FormDialog({ title, description, children, onClose, compact = false }: { title: string; description?: string; children: ReactNode; onClose: () => void; compact?: boolean }) {
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose() }}>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />
      <Dialog.Popup className={`fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] ${compact ? "max-w-lg" : "max-w-4xl"} -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 text-foreground shadow-xl sm:p-8`}>
        <div className="mb-4 flex items-center justify-between gap-4"><Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title><Dialog.Close className={outlineButton} aria-label="關閉視窗">關閉</Dialog.Close></div>
        {description && <Dialog.Description className="mb-5 text-sm leading-6 text-muted-foreground">{description}</Dialog.Description>}
        {children}
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>
}

export function ConfirmDialog({ title, children, onCancel, onConfirm, danger = false }: { title: string; children: ReactNode; onCancel: () => void; onConfirm: () => void; danger?: boolean }) {
  return <FormDialog title={title} onClose={onCancel}>
    <div className="text-sm leading-7">{children}</div>
    <div className="mt-6 flex justify-end gap-3"><button type="button" className={outlineButton} onClick={onCancel}>取消</button><button type="button" className={danger ? dangerButton : button} onClick={onConfirm}>確認</button></div>
  </FormDialog>
}
