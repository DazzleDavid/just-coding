import { createBrowserRouter, Navigate } from "react-router"
import App from "./App"
import { MainLayout } from "./layouts/MainLayout"
import { LoginRoute, RootRedirect } from "./components/shared/WorkspaceRoutes"
import { Dashboard } from "./pages/Dashboard"
import { Students } from "./pages/Students"
import { StudentDetail } from "./pages/StudentDetail"
import { StudentImport } from "./pages/StudentImport"
import {
  AssignmentsPage,
  AssignmentFormPage,
  AssignmentDetailPage,
} from "./pages/assignments/LazyAssignmentPages"
import {
  ProblemsPage,
  ProblemDetailPage,
  ProblemEditorPage,
} from "./pages/problems/LazyProblemPages"
import {
  ProblemTestCasesRedirect,
  ProblemGradingRedirect,
} from "./components/shared/ProblemTestCasesRedirect"
import { LegacyProblemRedirect } from "./components/shared/LegacyProblemRedirect"
import { GradesLayout } from "./layouts/GradesLayout"
import {
  GradesOverviewPage,
  StudentGradesPage,
  StudentGradeDetailPage,
  AssignmentGradesPage,
  AssignmentGradeDetailPage,
  SubmissionGradesPage,
} from "./pages/grades/LazyGradePages"
import { SubmissionListPage, SubmissionDetailPage } from "./pages/submissions/LazySubmissionPages"

export const router = createBrowserRouter([
  {
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
          { path: "assignments", element: <AssignmentsPage /> },
          { path: "assignments/new", element: <AssignmentFormPage /> },
          { path: "assignments/:assignmentId", element: <AssignmentDetailPage /> },
          { path: "assignments/:assignmentId/edit", element: <AssignmentFormPage /> },
          { path: "assignments/:assignmentId/problems/new", element: <LegacyProblemRedirect /> },
          {
            path: "assignments/:assignmentId/problems/:problemId/*",
            element: <LegacyProblemRedirect />,
          },
          { path: "problems", element: <ProblemsPage /> },
          { path: "problems/new", element: <ProblemEditorPage /> },
          { path: "problems/:problemId/edit", element: <ProblemEditorPage /> },
          { path: "problems/:problemId/details", element: <ProblemDetailPage /> },
          { path: "problems/:problemId/testcases", element: <ProblemTestCasesRedirect /> },
          { path: "problems/:problemId/grading", element: <ProblemGradingRedirect /> },
          {
            path: "special-rules",
            element: (
              <Navigate
                to="/problems"
                replace
              />
            ),
          },
          { path: "submissions", element: <SubmissionListPage /> },
          { path: "submissions/:submissionId", element: <SubmissionDetailPage /> },
          {
            path: "grades",
            element: <GradesLayout />,
            children: [
              { index: true, element: <GradesOverviewPage /> },
              { path: "students", element: <StudentGradesPage /> },
              { path: "students/:studentId", element: <StudentGradeDetailPage /> },
              { path: "assignments", element: <AssignmentGradesPage /> },
              { path: "assignments/:assignmentId", element: <AssignmentGradeDetailPage /> },
              { path: "submissions", element: <SubmissionGradesPage /> },
            ],
          },
        ],
      },
      { path: "*", element: <RootRedirect /> },
    ],
  },
])
