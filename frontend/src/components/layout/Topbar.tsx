import { Dialog } from "@base-ui/react/dialog"
import { Menu, Moon, Sun, UserRound } from "lucide-react"
import { Link } from "react-router"
import type { PageHeading } from "../../layouts/pageHeading"

type TopbarProps = {
  heading: PageHeading
  course: string | null
  theme: "light" | "dark"
  onToggleTheme: () => void
  sidebarExpanded: boolean
  onToggleSidebar: () => void
}

const iconButton =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"

export function Topbar({
  heading,
  course,
  theme,
  onToggleTheme,
  sidebarExpanded,
  onToggleSidebar,
}: TopbarProps) {
  return (
    <header className="flex min-h-[72px] shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 sm:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Dialog.Trigger
          className={`${iconButton} md:hidden`}
          aria-label="開啟側邊導覽"
          aria-controls="mobile-sidebar"
        >
          <Menu size={19} />
        </Dialog.Trigger>
        <button
          type="button"
          className={`${iconButton} hidden md:flex`}
          onClick={onToggleSidebar}
          aria-label={sidebarExpanded ? "收合側邊欄" : "展開側邊欄"}
          aria-expanded={sidebarExpanded}
          aria-controls="workspace-sidebar"
          title={sidebarExpanded ? "收合側邊欄" : "展開側邊欄"}
        >
          <Menu size={19} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{course || "Just Coding"}</span>
            {heading.parent && (
              <>
                <span aria-hidden="true">/</span>
                <Link
                  to={heading.parent.to}
                  className="shrink-0 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {heading.parent.title}
                </Link>
              </>
            )}
            {heading.section && (
              <span className="hidden truncate sm:inline">/ {heading.section}</span>
            )}
          </div>
          <h1
            title={heading.title}
            className="truncate text-base font-semibold sm:text-lg"
          >
            {heading.title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "切換淺色主題" : "切換深色主題"}
          className={iconButton}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="flex h-10 items-center gap-2 rounded-lg border border-border px-3">
          <UserRound size={18} />
          <span className="hidden text-sm sm:inline">助教</span>
        </div>
      </div>
    </header>
  )
}
