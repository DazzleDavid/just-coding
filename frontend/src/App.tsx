import { useEffect, useState } from "react"
import { Outlet } from "react-router"
import { StudentProvider } from "./components/students/StudentProvider"
import { ManagementProvider } from "./components/shared/ManagementProvider"
import { GradeProvider } from "./components/grades/GradeProvider"
import { WorkspaceContext } from "./hooks/useWorkspace"

function App() {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(() =>
    sessionStorage.getItem("just-coding-course"),
  )
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    localStorage.getItem("just-coding-theme") === "dark" ? "dark" : "light",
  )

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.style.colorScheme = theme
    localStorage.setItem("just-coding-theme", theme)
  }, [theme])

  function selectCourse(course: string) {
    sessionStorage.setItem("just-coding-course", course)
    setSelectedCourse(course)
  }

  return (
    <WorkspaceContext.Provider
      value={{
        theme,
        toggleTheme: () => setTheme((value) => (value === "light" ? "dark" : "light")),
        selectedCourse,
        selectCourse,
      }}
    >
      <StudentProvider>
        <ManagementProvider>
          <GradeProvider>
            <Outlet />
          </GradeProvider>
        </ManagementProvider>
      </StudentProvider>
    </WorkspaceContext.Provider>
  )
}

export default App
