import { Inbox } from "lucide-react"
import type { ReactNode } from "react"

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="space-y-3 p-10 text-center">
      <Inbox
        size={32}
        className="mx-auto text-muted-foreground"
      />
      <h2 className="font-semibold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children}
    </div>
  )
}
