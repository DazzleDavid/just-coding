import { lazy } from "react"

export const SubmissionListPage = lazy(() =>
  import("./SubmissionListPage").then((module) => ({ default: module.SubmissionListPage })),
)
export const SubmissionDetailPage = lazy(() =>
  import("./SubmissionDetailPage").then((module) => ({ default: module.SubmissionDetailPage })),
)
