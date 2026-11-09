import { Suspense, useContext, useEffect, useRef, useState } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { Outlet, useLocation } from "react-router"
import { Sidebar } from "../components/layout/Sidebar"
import { Topbar } from "../components/layout/Topbar"
import { useWorkspace } from "../hooks/useWorkspace"
import { useProblems } from "../hooks/problems/useProblems"
import { useStudents } from "../components/students/StudentStore"
import { getPageHeading } from "./pageHeading"
import { GradeContext } from "../hooks/grades/useGrades"

export function MainLayout() {
  const { theme, toggleTheme, selectedCourse } = useWorkspace()
  const location = useLocation()
  const main = useRef<HTMLElement>(null)
  const { data } = useProblems()
  const { students } = useStudents()
  const gradeStore = useContext(GradeContext)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const demoWorkspace = /^\/(grades|submissions)(\/|$)/.test(location.pathname)
    ? gradeStore?.workspace
    : undefined
  const heading = getPageHeading(location.pathname, {
    ...(demoWorkspace?.management ?? data),
    students: demoWorkspace?.students ?? students,
  })
  useEffect(() => {
    main.current?.scrollTo({ top: 0 })
  }, [location.pathname])
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)")
    const closeDrawer = () => {
      if (desktop.matches) setMobileOpen(false)
    }
    desktop.addEventListener("change", closeDrawer)
    return () => desktop.removeEventListener("change", closeDrawer)
  }, [])
  return (
    <Dialog.Root
      open={mobileOpen}
      onOpenChange={setMobileOpen}
    >
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground md:flex-row">
        <Sidebar
          expanded={sidebarExpanded}
          onNavigate={() => setMobileOpen(false)}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar
            heading={heading}
            course={selectedCourse}
            theme={theme}
            onToggleTheme={toggleTheme}
            sidebarExpanded={sidebarExpanded}
            onToggleSidebar={() => setSidebarExpanded((value) => !value)}
          />
          <main
            ref={main}
            tabIndex={0}
            aria-label="主要內容"
            className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-ring"
          >
            <Suspense
              fallback={
                <p
                  role="status"
                  className="p-8 text-sm text-muted-foreground"
                >
                  載入頁面中…
                </p>
              }
            >
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </Dialog.Root>
  )
}
