
import {
  BookOpen,
  ChartNoAxesColumn,
  Code2,
  Inbox,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react"

export type Page =
  | "dashboard"
  | "assignments"
  | "submissions"
  | "grades"
  | "students"

type SidebarProps = {
  page: Page
  onNavigate: (page: Page) => void
}

const menu: {
  id: Page
  title: string
  icon: LucideIcon
}[] = [
  {
    id: "dashboard",
    title: "儀表板",
    icon: LayoutDashboard,
  },
  {
    id: "assignments",
    title: "作業管理",
    icon: BookOpen,
  },
  {
    id: "submissions",
    title: "繳交紀錄",
    icon: Inbox,
  },
  {
    id: "grades",
    title: "成績管理",
    icon: ChartNoAxesColumn,
  },
  {
    id: "students",
    title: "學生管理",
    icon: Users,
  },
]

export function Sidebar({ page, onNavigate }: SidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-card md:min-h-screen md:w-60 md:border-r md:border-b-0">
      <div className="flex min-h-[72px] items-center gap-3 border-b border-border px-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Code2 size={22} />
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-tight">
            Just Coding.
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            Management Console
          </p>
        </div>
      </div>

      <nav
        aria-label="主要導覽"
        className="flex gap-1 overflow-x-auto p-3 md:flex-col"
      >
        {menu.map((item) => {
          const Icon = item.icon
          const active = page === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                active
                  ? "bg-blue-600/10 font-semibold text-blue-600 dark:bg-blue-400/10 dark:text-blue-400"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              <span>{item.title}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto hidden border-t border-border px-5 py-4 md:block">
        <p className="text-xs text-muted-foreground">
          Just Coding © 2026
        </p>
      </div>
    </aside>
  )
}
