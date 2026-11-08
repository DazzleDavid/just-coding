import { Suspense, useEffect, useRef } from "react"
import { Outlet, useLocation } from "react-router"
import { Sidebar } from "../components/layout/Sidebar"
import { Topbar } from "../components/layout/Topbar"
import { useWorkspace } from "../hooks/useWorkspace"
import { navigation } from "./navigation"

export function MainLayout() {
  const { theme, toggleTheme, selectedCourse } = useWorkspace()
  const location = useLocation()
  const main = useRef<HTMLElement>(null)
  const pageTitle =
    navigation.find((item) => location.pathname.split("/")[1] === item.id)?.title ?? "工作區"
  useEffect(() => {
    main.current?.scrollTo({ top: 0 })
  }, [location.pathname])
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground md:flex-row">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          title={`${selectedCourse ? `${selectedCourse} · ` : ""}${pageTitle}`}
          theme={theme}
          onToggleTheme={toggleTheme}
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
  )
}
