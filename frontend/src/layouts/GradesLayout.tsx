import { NavLink, Outlet } from "react-router"
import { GradeDataNotice } from "../components/grades/GradeDataNotice"

export function GradesLayout() {
  return (
    <div className="space-y-5 p-4 sm:p-6">
      <nav
        aria-label="查看成績分頁"
        className="flex flex-wrap gap-1 border-b border-border pb-3"
      >
        {[
          ["/grades", "成績總覽"],
          ["/grades/students", "學生成績"],
          ["/grades/assignments", "作業成績"],
          ["/grades/submissions", "提交成績"],
        ].map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/grades"}
            className={({ isActive }) =>
              `rounded-lg px-4 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <GradeDataNotice />
      <Outlet />
    </div>
  )
}
