import { createBrowserRouter, Navigate } from "react-router"
import App from "./App"
import { MainLayout } from "./layouts/MainLayout"
import { LoginRoute, RootRedirect } from "./components/shared/WorkspaceRoutes"
import { Dashboard } from "./pages/Dashboard"
import { Students } from "./pages/Students"
import { StudentDetail } from "./pages/StudentDetail"
import { StudentImport } from "./pages/StudentImport"
import { EmptyState } from "./components/shared/EmptyState"
import { ProblemsPage, ProblemDetailPage, ProblemEditorPage } from "./pages/problems/LazyProblemPages"
import { ProblemTestCasesRedirect, ProblemGradingRedirect } from "./components/shared/ProblemTestCasesRedirect"

export const router = createBrowserRouter([{
  element: <App />,
  children: [
    { index: true, element: <RootRedirect /> },
    { path: "login", element: <LoginRoute /> },
    {
      element: <MainLayout />,
      children: [
        { path: "dashboard", element: <Dashboard /> },
        { path: "students", element: <Students /> },
        { path: "students/import", element: <StudentImport /> },
        { path: "students/:id", element: <StudentDetail /> },
        { path: "assignments", element: <EmptyState title="作業管理" description="此功能頁面將於下一階段開發。" /> },
        { path: "problems", element: <ProblemsPage /> },
        { path: "problems/new", element: <ProblemEditorPage /> },
        { path: "problems/:problemId/edit", element: <ProblemEditorPage /> },
        { path: "problems/:problemId/details", element: <ProblemDetailPage /> },
        { path: "problems/:problemId/testcases", element: <ProblemTestCasesRedirect /> },
        { path: "problems/:problemId/grading", element: <ProblemGradingRedirect /> },
        { path: "special-rules", element: <Navigate to="/problems" replace /> },
        { path: "submissions", element: <EmptyState title="繳交紀錄" description="此功能頁面將於下一階段開發。" /> },
        { path: "grades", element: <EmptyState title="成績管理" description="此功能頁面將於下一階段開發。" /> },
      ],
    },
    { path: "*", element: <RootRedirect /> },
  ],
}])
