
import { useEffect, useState } from "react"
import { Sidebar, type Page } from "./components/layout/Sidebar"
import { Topbar } from "./components/layout/Topbar"
import { Dashboard } from "./pages/Dashboard"
import { Login } from "./pages/Login"
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router"
import { StudentProvider } from "./components/students/StudentProvider"
import { Students } from "./pages/Students"
import { StudentDetail } from "./pages/StudentDetail"
import { StudentImport } from "./pages/StudentImport"

type Theme = "light" | "dark"

const pageTitles: Record<Page, string> = {
  dashboard: "儀表板",
  assignments: "作業管理",
  submissions: "繳交紀錄",
  grades: "成績管理",
  students: "學生管理",
}

function App() {
  // Temporary UI session only; real authentication will be handled by the API.
  const [selectedCourse, setSelectedCourse] = useState<string | null>(() => sessionStorage.getItem("just-coding-course"))
  const location = useLocation()
  const navigate = useNavigate()
  const page = location.pathname.split("/")[1] as Page

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

  function handleLogin(course: string) {
    sessionStorage.setItem("just-coding-course", course)
    setSelectedCourse(course)
    navigate("/dashboard", { replace: true })
  }

  const workspace = (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground md:flex-row">
      <Sidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          title={`${selectedCourse ? `${selectedCourse} · ` : ""}${pageTitles[page] ?? "工作區"}`}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main tabIndex={0} aria-label="主要內容" className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-ring">
          <Outlet />
        </main>
      </div>
    </div>
  )

  return (
    <StudentProvider>
    <Routes>
      <Route path="/login" element={selectedCourse
        ? <Navigate to="/dashboard" replace />
        : <Login theme={theme} onToggleTheme={toggleTheme} onLogin={handleLogin} />} />
      <Route element={workspace}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/import" element={<StudentImport />} />
        <Route path="students/:id" element={<StudentDetail />} />
        {(Object.keys(pageTitles) as Page[]).filter((id) => id !== "dashboard" && id !== "students").map((id) => (
          <Route key={id} path={id} element={
            <div className="w-full px-6 py-8 sm:px-8">
              <h1 className="text-2xl font-bold">{pageTitles[id]}</h1>
              <p className="mt-3 text-sm text-muted-foreground">此功能頁面將於下一階段開發。</p>
            </div>
          } />
        ))}
      </Route>
      <Route path="*" element={<Navigate to={selectedCourse ? "/dashboard" : "/login"} replace />} />
    </Routes>
    </StudentProvider>
  )
}

export default App
