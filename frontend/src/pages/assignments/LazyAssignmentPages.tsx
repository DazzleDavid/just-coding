import { lazy } from "react"

export const AssignmentsPage = lazy(() => import("./AssignmentsPage").then((module) => ({ default: module.AssignmentsPage })))
export const AssignmentFormPage = lazy(() => import("./AssignmentFormPage").then((module) => ({ default: module.AssignmentFormPage })))
export const AssignmentDetailPage = lazy(() => import("./AssignmentDetailPage").then((module) => ({ default: module.AssignmentDetailPage })))
