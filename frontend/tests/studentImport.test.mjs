import assert from "node:assert/strict"
import { readFile, mkdir, writeFile } from "node:fs/promises"
import * as fs from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import test from "node:test"
import ts from "typescript"
import * as XLSX from "xlsx"

const output = resolve("node_modules/.tmp/student-tests")
await mkdir(output, { recursive: true })
for (const name of ["uuid", "students", "studentImport"]) {
  const source = await readFile(`src/lib/${name}.ts`, "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 },
  })
  await writeFile(
    `${output}/${name}.mjs`,
    outputText.replace(/from "(\.\/[^"\n]+)"/g, 'from "$1.mjs"'),
  )
}
const { validateStudent, seedStudents, createStudent, normalizeStudent } = await import(
  pathToFileURL(`${output}/students.mjs`).href
)
const { validateImport, readStudentWorkbook, downloadStudentTemplate, downloadImportReport } =
  await import(pathToFileURL(`${output}/studentImport.mjs`).href)
XLSX.set_fs(fs)
process.chdir(output)
const draft = {
  studentNumber: "0000123",
  name: "Test Student",
  email: "test@example.edu",
  className: "A",
  notes: "",
}
function row(data = draft, number = 2) {
  return {
    row: number,
    draft: data,
    raw: {
      學號: data.studentNumber,
      姓名: data.name,
      Email: data.email,
      班級: data.className,
      備註: data.notes,
    },
  }
}
function workbook(rows) {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "學生名單")
  return XLSX.write(wb, { type: "array", bookType: "xlsx" })
}
test("mock counts and form validation enforce identity, email and notes", () => {
  const students = seedStudents()
  assert.equal(students.length, 120)
  assert.equal(students.filter((s) => s.active).length, 115)
  assert.equal(Object.keys(validateStudent(draft, [])).length, 0)
  assert.ok(validateStudent({ ...draft, email: "invalid" }, []).email)
  assert.ok(
    validateStudent({ ...draft, studentNumber: "", name: "", notes: "a".repeat(201) }, [])
      .studentNumber,
  )
  const existing = createStudent(draft)
  assert.deepEqual(normalizeStudent(existing), draft)
  assert.ok(validateStudent({ ...draft, email: draft.email.toUpperCase() }, [existing]).email)
  assert.equal(Object.keys(validateStudent(draft, [existing], existing.id)).length, 0)
})
test("reimport skips exact matches and rejects mismatches without overwriting", () => {
  const existing = createStudent(draft)
  assert.equal(validateImport([row()], [existing])[0].status, "duplicate")
  assert.equal(
    validateImport([row({ ...draft, name: "Different" })], [existing])[0].status,
    "error",
  )
  assert.equal(
    validateImport([row({ ...draft, studentNumber: "0000999" })], [existing])[0].status,
    "error",
  )
  assert.equal(validateImport([row()], [])[0].status, "valid")
})
test("all duplicated Excel rows conflict, including case-insensitive emails", () => {
  const results = validateImport(
    [row(), row({ ...draft, studentNumber: "0000456", email: draft.email.toUpperCase() }, 3)],
    [],
  )
  assert.ok(results.every((r) => r.status === "error"))
  assert.ok(results[0].reasons.some((r) => r.includes("Excel 內重複")))
})
test("xlsx preserves text and formatted numeric leading zeroes and actual row numbers", async () => {
  const wb = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet([
    ["學號", "姓名", "班級"],
    ["0000123", "Test", "A"],
    [],
    [123, "Other", "B"],
  ])
  sheet.A4.z = "0000000"
  XLSX.utils.book_append_sheet(wb, sheet, "學生名單")
  const rows = await readStudentWorkbook(XLSX.write(wb, { type: "array", bookType: "xlsx" }))
  assert.equal(rows[0].draft.studentNumber, "0000123")
  assert.equal(rows[1].draft.studentNumber, "0000123")
  assert.equal(rows[1].row, 4)
})
test("malformed, missing columns, empty and oversized row sets are rejected", async () => {
  await assert.rejects(readStudentWorkbook(new TextEncoder().encode("not an Excel file").buffer))
  await assert.rejects(readStudentWorkbook(workbook([["姓名"], ["A"]])), /缺少必要欄位/)
  await assert.rejects(readStudentWorkbook(workbook([["學號", "姓名", "班級"]])), /沒有可匯入/)
  await assert.rejects(
    readStudentWorkbook(
      workbook([
        ["學號", "姓名", "班級"],
        ...Array.from({ length: 1001 }, (_, i) => [String(i), "A", "B"]),
      ]),
    ),
    /1,000/,
  )
})
test("formula cells are retained in report data but never imported", async () => {
  const wb = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet([
    ["學號", "姓名", "班級"],
    ["0000123", "A", "B"],
  ])
  sheet.A2 = { t: "s", f: 'TEXT(123,"0000000")', v: "0000123" }
  XLSX.utils.book_append_sheet(wb, sheet, "學生名單")
  const rows = await readStudentWorkbook(XLSX.write(wb, { type: "array", bookType: "xlsx" }))
  assert.equal(validateImport(rows, [])[0].status, "error")
  assert.ok(rows[0].raw.學號.startsWith("="))
})
test("template is a real xlsx with text-formatted IDs; report includes source and outcomes", async () => {
  await downloadStudentTemplate()
  const template = XLSX.readFile("JustCoding_學生匯入範本.xlsx")
  const sheet = template.Sheets[template.SheetNames[0]]
  assert.deepEqual(XLSX.utils.sheet_to_json(sheet, { header: 1 })[0], ["班級", "姓名", "學號"])
  assert.equal(
    XLSX.readFile("JustCoding_學生匯入範本.xlsx", { cellNF: true, sheetStubs: true }).Sheets
      .學生名單.C2.z,
    "@",
  )
  await downloadImportReport(validateImport([row()], []))
  const report = XLSX.readFile("JustCoding_學生匯入結果.xlsx")
  const values = XLSX.utils.sheet_to_json(report.Sheets[report.SheetNames[0]], { header: 1 })
  assert.equal(values[1][0], 2)
  assert.ok(values[1].includes("0000123"))
  assert.ok(values[1].includes("新增成功"))
})

test("only imports three fields from the first sheet and ignores grades, formulas and other sheets", async () => {
  const wb = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet([
    ["班級", "姓名", "學號", "成績", "Email"],
    ["A", "Test", "0000123", 90, "ignore@example.edu"],
    [null, null, null, 100],
  ])
  sheet.D2 = { t: "n", f: "1+1", v: 2 }
  XLSX.utils.book_append_sheet(wb, sheet, "名單")
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["其他工作表"], ["不應讀取"]]), "其他")
  const rows = await readStudentWorkbook(XLSX.write(wb, { type: "array", bookType: "xlsx" }))
  assert.equal(rows.length, 1)
  assert.deepEqual(Object.keys(rows[0].raw), ["班級", "姓名", "學號"])
  assert.equal(rows[0].draft.email, "")
  assert.equal(validateImport(rows, [])[0].status, "valid")
  const existing = createStudent({
    ...rows[0].draft,
    email: "existing@example.edu",
    notes: "Keep notes",
  })
  assert.equal(validateImport(rows, [existing])[0].status, "duplicate")
  assert.equal(
    Object.keys(
      validateStudent({ ...draft, email: "" }, [
        { ...existing, studentNumber: "other", email: "" },
      ]),
    ).length,
    0,
  )
})
