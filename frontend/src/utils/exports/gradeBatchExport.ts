import type { Student } from "../../lib/students"
import type { AssignmentGradeSummary, StudentAssignmentGrade } from "../../types/grade"
import {
  gradeExportMetrics,
  gradeExportMetricLabels,
  type GradeExportMetric,
  type GradeExportReport,
  type ExportValue,
  type GradeRoster,
} from "../../types/exports"
import { gradeText } from "../grades/gradeFormat"

export function selectedGradeAssignments(
  summaries: AssignmentGradeSummary[],
  ids: string[],
  metrics: GradeExportMetric[],
) {
  if (!ids.length) throw new Error("請至少選擇一份作業。")
  if (!metrics.length || metrics.some((metric) => !gradeExportMetrics.includes(metric)))
    throw new Error("請至少選擇一項有效的匯出內容。")
  if (new Set(ids).size !== ids.length || new Set(metrics).size !== metrics.length)
    throw new Error("作業或匯出內容不可重複。")
  return ids.map((id) => {
    const summary = summaries.find((item) => item.assignment.id === id)
    if (!summary) throw new Error("選擇的作業已不存在，請重新選擇。")
    if (summary.assignment.status === "draft")
      throw new Error(`${summary.assignment.code} 尚為草稿，無法匯出正式成績。`)
    return summary
  })
}

function gradeValue(
  row: StudentAssignmentGrade | undefined,
  metric: GradeExportMetric,
): ExportValue {
  if (!row) return "不適用"
  if (metric === "score")
    return row.score === null ? gradeText(null, row.state) : Number(row.score.toFixed(4))
  if (metric === "submitted") return row.submitted
  if (metric === "completed") return row.completed
  return row.submissionCount
}

function assignmentHeaders(summaries: AssignmentGradeSummary[], metrics: GradeExportMetric[]) {
  return summaries.flatMap((summary) =>
    metrics.map((metric) => {
      const reference =
        metric === "score"
          ? `滿分 ${summary.maxScore}`
          : metric === "attempts"
            ? "次"
            : `共 ${summary.totalProblems} 題`
      return `${summary.assignment.code} ${gradeExportMetricLabels[metric]}（${reference}）`
    }),
  )
}

function valuesFor(
  studentId: string,
  summaries: AssignmentGradeSummary[],
  metrics: GradeExportMetric[],
) {
  return summaries.flatMap((summary) =>
    metrics.map((metric) =>
      gradeValue(
        summary.rows.find((row) => row.student.id === studentId),
        metric,
      ),
    ),
  )
}

export function buildBatchGradeReport(
  summaries: AssignmentGradeSummary[],
  ids: string[],
  metrics: GradeExportMetric[],
): GradeExportReport {
  const selected = selectedGradeAssignments(summaries, ids, metrics)
  const students = [
    ...new Map(
      selected.flatMap((summary) =>
        summary.rows.map((row) => [row.student.id, row.student] as const),
      ),
    ).values(),
  ].sort((a, b) => a.studentNumber.localeCompare(b.studentNumber, "en", { numeric: true }))
  if (!students.length) throw new Error("尚無學生資料，無可匯出的資料。")
  if (new Set(students.map((student) => student.studentNumber.trim())).size !== students.length)
    throw new Error("所選名單有重複學號，請先整理學生資料。")
  return {
    headers: ["班級", "學號", "姓名", ...assignmentHeaders(selected, metrics)],
    rows: students.map((student) => [
      student.className,
      student.studentNumber,
      student.name,
      ...valuesFor(student.id, selected, metrics),
    ]),
    preview: students.map((student, index) => ({
      row: index + 2,
      studentNumber: student.studentNumber,
      name: student.name,
      result: "依學號排序",
      matched: true,
    })),
    textColumns: [0, 1, 2],
    matched: students.length,
    unmatched: 0,
  }
}

export function buildRosterGradeReport(
  summaries: AssignmentGradeSummary[],
  ids: string[],
  metrics: GradeExportMetric[],
  students: Student[],
  roster: GradeRoster,
): GradeExportReport {
  const selected = selectedGradeAssignments(summaries, ids, metrics)
  if (!roster.rows.length) throw new Error("沒有可匯出的學生名單。")
  const lookup = new Map<string, Student[]>()
  students.forEach((student) => {
    const key = student.studentNumber.trim()
    lookup.set(key, [...(lookup.get(key) ?? []), student])
  })
  const source = roster.rows
  const occurrences = new Map<string, number>()
  source.forEach((row) => {
    const id = row.studentNumber.trim()
    if (id) occurrences.set(id, (occurrences.get(id) ?? 0) + 1)
  })
  const headers = ["班級", "姓名", "學號", ...assignmentHeaders(selected, metrics)]
  const rows: ExportValue[][] = []
  const preview: GradeExportReport["preview"] = []
  source.forEach((sourceRow) => {
    const id = sourceRow.studentNumber.trim()
    const providedName = sourceRow.name.trim()
    const matches = lookup.get(id) ?? []
    const student = id && !sourceRow.issue && matches.length === 1 ? matches[0] : undefined
    let result =
      sourceRow.issue ??
      (!id
        ? "學號空白"
        : matches.length > 1
          ? "系統學號重複，無法比對"
          : !student
            ? "查無學生"
            : "比對成功")
    if (student && (occurrences.get(id) ?? 0) > 1) result += "；名單學號重複"
    if (student && providedName && providedName !== student.name.trim())
      result += "；姓名與系統不一致（依學號比對）"
    const gradeValues = student
      ? valuesFor(student.id, selected, metrics)
      : Array(selected.length * metrics.length).fill(result)
    rows.push([sourceRow.className, sourceRow.name, sourceRow.studentNumber, ...gradeValues])
    preview.push({
      row: sourceRow.sourceRow,
      studentNumber: id,
      name: providedName,
      result,
      matched: !!student,
    })
  })
  const matched = preview.filter((row) => row.matched).length
  if (!matched)
    throw new Error("沒有任何學號可比對，請確認系統學生名單及 Excel 學號；學號需保留前導零。")
  return {
    headers,
    rows,
    preview,
    textColumns: [0, 1, 2],
    matched,
    unmatched: preview.filter((row) => !row.matched).length,
  }
}

export async function createBatchGradeWorkbook(report: GradeExportReport, roster = false) {
  if (!report.rows.length) throw new Error("沒有可匯出的資料。")
  const XLSX = await import("xlsx")
  const sheet = XLSX.utils.aoa_to_sheet([report.headers, ...report.rows])
  report.rows.forEach((row, rowIndex) =>
    row.forEach((value, columnIndex) => {
      const text = typeof value === "string" || report.textColumns.includes(columnIndex)
      sheet[XLSX.utils.encode_cell({ r: rowIndex + 1, c: columnIndex })] = text
        ? { t: "s", v: String(value), z: "@" }
        : typeof value === "boolean"
          ? { t: "b", v: value }
          : { t: "n", v: value, z: Number.isInteger(value) ? "0" : "0.####" }
    }),
  )
  sheet["!cols"] = report.headers.map((header) => ({
    wch: Math.min(40, Math.max(18, header.length + 8)),
  }))
  sheet["!autofilter"] = { ref: sheet["!ref"]! }
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, roster ? "依名單順序成績" : "作業成績")
  return workbook
}

export function batchGradeFilename(roster = false, demo = false, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const day = ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)?.value ?? "")
    .join("")
  return `${demo ? "測試_" : ""}${roster ? "依名單順序_" : ""}作業成績_${day}.xlsx`
}

export async function downloadBatchGradeReport(
  report: GradeExportReport,
  roster = false,
  demo = false,
) {
  const workbook = await createBatchGradeWorkbook(report, roster)
  const XLSX = await import("xlsx")
  XLSX.writeFileXLSX(workbook, batchGradeFilename(roster, demo))
}
