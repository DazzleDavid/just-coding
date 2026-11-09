import type { AssignmentGradeSummary } from "../../types/grade"

export const gradeExportHeaders = ["學號", "姓名", "已提交題數", "作業總題數"]

export function gradeExportRows(summary: AssignmentGradeSummary) {
  if (!summary.rows.length)
    throw new Error("尚無學生資料，無可匯出的資料。請先至學生管理新增或匯入學生。")
  return [...summary.rows]
    .sort((a, b) =>
      a.student.studentNumber.localeCompare(b.student.studentNumber, "en", { numeric: true }),
    )
    .map((row): [string, string, number, number] => [
      row.student.studentNumber,
      row.student.name,
      row.submitted,
      summary.totalProblems,
    ])
}

export function gradeExportFilename(code: string, date = new Date(), demo = false) {
  const safe =
    [...code]
      .map((character) =>
        character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character) ? "_" : character,
      )
      .join("")
      .replace(/[. ]+$/g, "")
      .slice(0, 80) || "Assignment"
  const day = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`
  return `${demo ? "示範_" : ""}${safe}_已提交題數_${day}.xlsx`
}

export async function createGradeWorkbook(summary: AssignmentGradeSummary) {
  const rows = gradeExportRows(summary)
  const XLSX = await import("xlsx")
  const sheet = XLSX.utils.aoa_to_sheet([gradeExportHeaders, ...rows])
  // Explicit strings with no formula field keep leading zeroes and formula-like text inert.
  rows.forEach((row, index) => {
    for (const column of [0, 1])
      sheet[XLSX.utils.encode_cell({ r: index + 1, c: column })] = {
        t: "s",
        v: row[column],
        z: "@",
      }
    for (const column of [2, 3])
      sheet[XLSX.utils.encode_cell({ r: index + 1, c: column })] = {
        t: "n",
        v: row[column],
        z: "0",
      }
  })
  sheet["!cols"] = [{ wch: 22 }, { wch: 22 }, { wch: 16 }, { wch: 16 }]
  sheet["!autofilter"] = { ref: sheet["!ref"]! }
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, "已提交題數")
  return workbook
}

export async function downloadGradeWorkbook(summary: AssignmentGradeSummary, demo = false) {
  const workbook = await createGradeWorkbook(summary)
  const XLSX = await import("xlsx")
  XLSX.writeFileXLSX(workbook, gradeExportFilename(summary.assignment.code, new Date(), demo))
}
