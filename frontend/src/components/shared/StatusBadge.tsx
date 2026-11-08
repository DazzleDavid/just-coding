export function StatusBadge({ label }: { label: string }) {
  const color =
    label === "進行中" || label === "完整" || label === "公開" || label === "啟用"
      ? "bg-primary/10 text-primary"
      : label === "未完成"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "bg-muted text-muted-foreground"
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${color}`}
    >
      {label}
    </span>
  )
}
