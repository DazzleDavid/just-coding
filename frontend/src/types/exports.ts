export const gradeExportMetrics = ["score", "submitted", "completed", "attempts"] as const
export type GradeExportMetric = (typeof gradeExportMetrics)[number]
export const gradeExportMetricLabels: Record<GradeExportMetric, string> = {
  score: "採計成績",
  submitted: "已提交題數",
  completed: "已完成題數",
  attempts: "提交總次數",
}
export type ExportValue = string | number | boolean
export type GradeRosterRow = {
  sourceRow: number
  className: string
  name: string
  studentNumber: string
  issue?: string
}
export type GradeRoster = { sheetName: string; rows: GradeRosterRow[] }
export type GradeExportReport = {
  headers: string[]
  rows: ExportValue[][]
  preview: { row: number; studentNumber: string; name: string; result: string; matched: boolean }[]
  textColumns: number[]
  matched: number
  unmatched: number
}
