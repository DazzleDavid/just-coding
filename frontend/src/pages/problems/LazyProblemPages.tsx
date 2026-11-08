import { lazy } from "react"

export const ProblemsPage = lazy(() =>
  import("./ProblemsPage").then((module) => ({ default: module.ProblemsPage })),
)
export const ProblemEditorPage = lazy(() =>
  import("./ProblemEditorPage").then((module) => ({ default: module.ProblemEditorPage })),
)
export const ProblemDetailPage = lazy(() =>
  import("./ProblemDetailPage").then((module) => ({ default: module.ProblemDetailPage })),
)
