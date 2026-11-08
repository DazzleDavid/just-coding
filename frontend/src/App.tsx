
import { useEffect, useState } from "react"
import { Sidebar, type Page } from "./components/layout/Sidebar"
import { Topbar } from "./components/layout/Topbar"
import { Dashboard } from "./pages/Dashboard"

type Theme = "light" | "dark"

const pageTitles: Record<Page, string> = {
  dashboard: "儀表板",
  assignments: "作業管理",
  submissions: "繳交紀錄",
  grades: "成績管理",
  students: "學生管理",
}

function App() {
  const [page, setPage] = useState<Page>("dashboard")

  const [theme, setTheme] = useState<Theme>(() => {
    return localStorage.getItem("just-coding-theme") === "dark"
      ? "dark"
      : "light"
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.style.colorScheme = theme
    localStorage.setItem("just-coding-theme", theme)
  }, [theme])

  function toggleTheme() {
    setTheme((current) => current === "light" ? "dark" : "light")
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground md:flex-row">
      <Sidebar page={page} onNavigate={setPage} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={pageTitles[page]}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="min-w-0 flex-1">
          {page === "dashboard" ? (
            <Dashboard />
          ) : (
            <div className="w-full px-6 py-8 sm:px-8">
              <h1 className="text-2xl font-bold">
                {pageTitles[page]}
              </h1>

              <p className="mt-3 text-sm text-muted-foreground">
                此功能頁面將於下一階段開發。
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App