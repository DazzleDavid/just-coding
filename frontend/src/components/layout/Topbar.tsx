
import { Moon, Sun, UserRound } from "lucide-react"

type TopbarProps = {
  title: string
  theme: "light" | "dark"
  onToggleTheme: () => void
}

export function Topbar({
  title,
  theme,
  onToggleTheme,
}: TopbarProps) {
  return (
    <header className="flex min-h-[72px] shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 sm:px-8">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">
          Just Coding / Workspace
        </p>

        <h2 className="truncate text-lg font-semibold">
          {title}
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={
            theme === "dark"
              ? "切換淺色主題"
              : "切換深色主題"
          }
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border transition-colors hover:bg-accent"
        >
          {theme === "dark" ? (
            <Sun size={18} />
          ) : (
            <Moon size={18} />
          )}
        </button>

        <div className="flex h-10 items-center gap-2 rounded-lg border border-border px-3">
          <UserRound size={18} />
          <span className="hidden text-sm sm:inline">
            助教
          </span>
        </div>
      </div>
    </header>
  )
}
