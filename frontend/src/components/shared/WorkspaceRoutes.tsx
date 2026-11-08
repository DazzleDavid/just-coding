import { Navigate, useNavigate } from "react-router"
import { useWorkspace } from "../../hooks/useWorkspace"
import { Login } from "../../pages/Login"

export function LoginRoute() {
  const { theme, toggleTheme, selectedCourse, selectCourse } = useWorkspace()
  const navigate = useNavigate()
  return selectedCourse ? <Navigate to="/dashboard" replace /> : <Login theme={theme} onToggleTheme={toggleTheme} onLogin={(course) => { selectCourse(course); navigate("/dashboard", { replace: true }) }} />
}

export function RootRedirect() {
  const { selectedCourse } = useWorkspace()
  return <Navigate to={selectedCourse ? "/dashboard" : "/login"} replace />
}
