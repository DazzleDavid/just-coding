import { lazy } from "react"

export const GradesOverviewPage = lazy(() =>
  import("./GradesOverviewPage").then((module) => ({ default: module.GradesOverviewPage })),
)
export const StudentGradesPage = lazy(() =>
  import("./StudentGradesPage").then((module) => ({ default: module.StudentGradesPage })),
)
export const StudentGradeDetailPage = lazy(() =>
  import("./StudentGradeDetailPage").then((module) => ({ default: module.StudentGradeDetailPage })),
)
export const AssignmentGradesPage = lazy(() =>
  import("./AssignmentGradesPage").then((module) => ({ default: module.AssignmentGradesPage })),
)
export const AssignmentGradeDetailPage = lazy(() =>
  import("./AssignmentGradeDetailPage").then((module) => ({
    default: module.AssignmentGradeDetailPage,
  })),
)
export const SubmissionGradesPage = lazy(() =>
  import("./SubmissionGradesPage").then((module) => ({ default: module.SubmissionGradesPage })),
)
