import { lazy } from "react"

export const GradeExportPage = lazy(() =>
  import("./GradeExportPage").then((module) => ({ default: module.GradeExportPage })),
)
