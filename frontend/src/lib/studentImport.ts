import { normalizeStudent, validateStudent, type Student, type StudentDraft } from "./students"

export const importHeaders = ["班級", "姓名", "學號"]
export type ImportRow = { row: number; draft: StudentDraft; raw: Record<string, string>; cellError?: string }
export type ImportResult = ImportRow & { status: "valid" | "duplicate" | "error"; reasons: string[] }
export const importStatus = { valid: "有效資料", duplicate: "重複資料（略過）", error: "錯誤資料（不匯入）" }

export function validateImport(rows: ImportRow[], students: Student[]): ImportResult[] {
  const numbers = new Map<string, number>()
  const emails = new Map<string, number>()
  rows.forEach(({ draft }) => {
    if (draft.studentNumber) numbers.set(draft.studentNumber, (numbers.get(draft.studentNumber) ?? 0) + 1)
    if (draft.email) emails.set(draft.email.toLowerCase(), (emails.get(draft.email.toLowerCase()) ?? 0) + 1)
  })
  return rows.map((item) => {
    const { draft } = item
    const reasons = Object.values(validateStudent(draft, []))
    if (item.cellError) reasons.push(item.cellError)
    if ((numbers.get(draft.studentNumber) ?? 0) > 1) reasons.push("學號在 Excel 內重複。")
    if ((emails.get(draft.email.toLowerCase()) ?? 0) > 1) reasons.push("Email 在 Excel 內重複。")
    const same = students.find((student) => student.studentNumber === draft.studentNumber)
    const emailOwner = draft.email ? students.find((student) => student.email.toLowerCase() === draft.email.toLowerCase()) : undefined
    const identical = same && same.name === draft.name && same.className === draft.className && (!draft.email || same.email.toLowerCase() === draft.email.toLowerCase()) && (!draft.notes || same.notes === draft.notes)
    if (same && !identical) reasons.push("學號與既有資料重複且內容不一致。")
    if (emailOwner && emailOwner.id !== same?.id) reasons.push("Email 與其他學生衝突。")
    const status = reasons.length ? "error" : identical ? "duplicate" : "valid"
    return { ...item, status, reasons: status === "duplicate" ? ["資料已存在且內容一致，略過。"] : reasons }
  })
}

export async function readStudentWorkbook(buffer: ArrayBuffer): Promise<ImportRow[]> {
  const XLSX = await import("xlsx")
  const workbook = XLSX.read(buffer, { type: "array", cellFormula: true, cellText: true })
  if (workbook.bookType !== "xlsx") throw new Error("檔案內容不是有效的 .xlsx 活頁簿。")
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet?.["!ref"]) throw new Error("第一個工作表沒有資料。")
  const range = XLSX.utils.decode_range(sheet["!ref"])
  if (range.e.c > 100) throw new Error("欄位過多，請使用學生匯入範本。")
  const headers = Array.from({ length: range.e.c + 1 }, (_, column) => XLSX.utils.format_cell(sheet[XLSX.utils.encode_cell({ r: 0, c: column })]).trim())
  if (importHeaders.some((header) => !headers.includes(header))) throw new Error("缺少必要欄位：班級、姓名、學號。第一列必須是欄位標題。")
  if (importHeaders.some((header) => headers.filter((value) => value === header).length > 1)) throw new Error("學生欄位標題重複，請修正後重新上傳。")
  // Ignore formatted empty rows; only inspect actual cells in the worksheet.
  const rowNumbers = new Set<number>()
  Object.keys(sheet).filter((key) => !key.startsWith("!")).forEach((key) => {
    const address = XLSX.utils.decode_cell(key)
    const cell = sheet[key]
    if (address.r > 0 && importHeaders.includes(headers[address.c]) && (cell.f || (cell.v !== undefined && String(cell.v).trim()))) rowNumbers.add(address.r)
  })
  if (rowNumbers.size > 1000) throw new Error("單次最多匯入 1,000 筆學生。")
  const rows: ImportRow[] = []
  for (const row of [...rowNumbers].sort((a, b) => a - b)) {
    const raw: Record<string, string> = {}
    let cellError = ""
    headers.forEach((header, column) => {
      if (!importHeaders.includes(header)) return
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })]
      if (header) raw[header] = cell ? cell.f ? `=${cell.f}` : XLSX.utils.format_cell(cell) : ""
      if (importHeaders.includes(header) && (cell?.f || cell?.t === "e")) cellError = "學生欄位包含公式或儲存格錯誤，請改為純文字。"
      if (header === "學號" && typeof cell?.v === "number" && !Number.isSafeInteger(cell.v)) cellError = "學號數值精度不可靠，請在 Excel 中以文字格式重新輸入。"
    })
    const draft = normalizeStudent({ studentNumber: raw["學號"] ?? "", name: raw["姓名"] ?? "", email: "", className: raw["班級"] ?? "", notes: "" })
    rows.push({ row: row + 1, raw, draft, cellError })
  }
  if (!rows.length) throw new Error("工作表沒有可匯入的學生資料。")
  return rows
}

export async function downloadStudentTemplate() {
  const XLSX = await import("xlsx")
  const sheet = XLSX.utils.aoa_to_sheet([importHeaders])
  sheet["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 20 }]
  // Pre-format the input cells as text so Excel preserves leading zeroes.
  for (let row = 1; row <= 1000; row++) {
    sheet[XLSX.utils.encode_cell({ r: row, c: 2 })] = { t: "s", v: "", z: "@" }
  }
  sheet["!ref"] = "A1:C1001"
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, "學生名單")
  XLSX.writeFileXLSX(workbook, "JustCoding_學生匯入範本.xlsx")
}

export async function downloadImportReport(results: ImportResult[]) {
  const XLSX = await import("xlsx")
  const rawHeaders = [...new Set(results.flatMap((item) => Object.keys(item.raw)))]
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Excel 列號", ...rawHeaders, "處理狀態", "錯誤原因"],
    ...results.map((item) => [item.row, ...rawHeaders.map((header) => item.raw[header] ?? ""), item.status === "valid" ? "新增成功" : item.status === "duplicate" ? "略過" : "未匯入", item.reasons.map((reason) => `第 ${item.row} 列：${reason}`).join("；")]),
  ])
  sheet["!cols"] = [{ wch: 12 }, ...rawHeaders.map(() => ({ wch: 25 })), { wch: 14 }, { wch: 70 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, "匯入結果")
  XLSX.writeFileXLSX(workbook, "JustCoding_學生匯入結果.xlsx")
}
