
import {
  BookOpen,
  ChartNoAxesColumn,
  Code2,
  Inbox,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react"
import { NavLink } from "react-router"

export type Page =
  | "dashboard"
  | "assignments"
  | "submissions"
  | "grades"
  | "students"

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

export function Sidebar() {
  return (
    <aside className="flex min-h-0 w-full shrink-0 flex-col border-b border-border bg-card md:h-full md:w-60 md:border-r md:border-b-0">
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

          return (
            <NavLink
              key={item.id}
              to={`/${item.id}`}
              className={({ isActive }) => `flex shrink-0 cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                isActive
                  ? "bg-blue-600/10 font-semibold text-blue-600 dark:bg-blue-400/10 dark:text-blue-400"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              <span>{item.title}</span>
            </NavLink>
          )
        })}
      </nav>

      <footer className="mt-auto shrink-0 border-t border-border px-5 py-3 text-xs leading-5 text-muted-foreground md:py-4">
        <p>Copyright © {new Date().getFullYear()} J.D.I.哲哲.</p>
        <p>版權所有。<span lang="en">All rights reserved.</span></p>
      </footer>
    </aside>
  )
}
