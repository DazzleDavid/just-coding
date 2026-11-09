import type { CellObject, WorkBook } from "xlsx"
import type { GradeRoster, GradeRosterRow } from "../../types/exports"

export const gradeRosterHeaders = ["班級", "姓名", "學號"] as const
const aliases = [
  new Set(["班級", "學生班級", "class", "classname"]),
  new Set(["姓名", "學生姓名", "name", "studentname"]),
  new Set(["學號", "學生學號", "學籍編號", "studentid", "studentnumber"]),
]
const normalizeHeader = (value: string) =>
  value
    .trim()
    .replace(/[\s_-]/g, "")
    .toLowerCase()

export async function readGradeRosterWorkbook(buffer: ArrayBuffer): Promise<GradeRoster> {
  if (buffer.byteLength > 5 * 1024 * 1024) throw new Error("Excel 檔案不得超過 5 MB。")
  const XLSX = await import("xlsx")
  let workbook: WorkBook
  try {
    workbook = XLSX.read(buffer, { type: "array", cellFormula: true, cellText: true })
  } catch {
    throw new Error("無法讀取 Excel，請確認檔案未損壞且未加密。")
  }
  if (workbook.bookType !== "xlsx") throw new Error("請提供有效的 .xlsx Excel 檔案。")
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) throw new Error("第一個工作表沒有名單資料。")
  const addresses = Object.keys(sheet).filter((address) => /^[A-Z]+[1-9]\d*$/.test(address))
  const headerCandidates = new Map<number, number[][]>()
  addresses.forEach((address) => {
    const position = XLSX.utils.decode_cell(address)
    if (position.r >= 30 || sheet[address].f) return
    const text = normalizeHeader(XLSX.utils.format_cell(sheet[address]))
    const field = aliases.findIndex((names) => names.has(text))
    if (field < 0) return
    const candidates = headerCandidates.get(position.r) ?? [[], [], []]
    candidates[field].push(position.c)
    headerCandidates.set(position.r, candidates)
  })
  const header = [...headerCandidates.entries()]
    .sort(([a], [b]) => a - b)
    .find(([, columns]) => columns.every((matches) => matches.length > 0))
  if (!header)
    throw new Error("第一個工作表缺少必要欄位：班級、姓名、學號，請確認前 30 列包含欄位標題。")
  const [headerRow, candidates] = header
  if (candidates.some((matches) => matches.length !== 1))
    throw new Error("班級、姓名或學號欄位重複，請保留各一欄後重新上傳。")
  const columns = candidates.map((matches) => matches[0])
  const rowNumbers = new Set<number>()
  addresses.forEach((address) => {
    const position = XLSX.utils.decode_cell(address)
    // Class-only headings, empty rows and summaries in other columns are not students.
    if (position.r > headerRow && columns.slice(1).includes(position.c)) {
      const cell = sheet[address]
      if (cell.f || (cell.v !== undefined && String(cell.v).trim())) rowNumbers.add(position.r)
    }
  })
  if (!rowNumbers.size) throw new Error("第一個工作表沒有可讀取的學生名單。")
  if (rowNumbers.size > 5000) throw new Error("名單最多支援 5,000 位學生。")
  function readIdentityCell(cell: CellObject | undefined, field: number) {
    if (!cell) return { text: "", issue: undefined }
    const issue = cell.f
      ? `${gradeRosterHeaders[field]}含公式，不自動比對`
      : cell.t === "e"
        ? `${gradeRosterHeaders[field]}儲存格錯誤`
        : field === 2 && typeof cell.v === "number" && !Number.isSafeInteger(cell.v)
          ? "學號數值精度不可靠"
          : undefined
    return { text: cell.f ? "" : XLSX.utils.format_cell(cell).trim(), issue }
  }
  const rows: GradeRosterRow[] = [...rowNumbers]
    .sort((a, b) => a - b)
    .map((row) => {
      const values = columns.map((column, field) =>
        readIdentityCell(sheet[XLSX.utils.encode_cell({ r: row, c: column })], field),
      )
      return {
        sourceRow: row + 1,
        className: values[0].text,
        name: values[1].text,
        studentNumber: values[2].text,
        issue: values.find((value) => value.issue)?.issue,
      }
    })
  return { sheetName, rows }
}
