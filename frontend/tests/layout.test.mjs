import assert from "node:assert/strict"
import { readFile, mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import test from "node:test"
import ts from "typescript"

const output = resolve("node_modules/.tmp/layout-tests")
await mkdir(output, { recursive: true })
const source = await readFile("src/layouts/pageHeading.ts", "utf8")
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
})
const target = `${output}/pageHeading.mjs`
await writeFile(target, outputText)
const { getPageHeading } = await import(pathToFileURL(target).href)
const data = {
  problems: [{ id: "problem", code: "P0001", title: "A + B" }],
  assignments: [{ id: "assignment", code: "HW01", title: "第一次作業" }],
  students: [{ id: "student", studentNumber: "00123", name: "王同學" }],
}

test("list pages retain their titles in the topbar", () => {
  for (const [path, title] of [
    ["/dashboard", "儀表板"],
    ["/students", "學生管理"],
    ["/problems", "題目管理"],
    ["/assignments", "作業管理"],
  ]) {
    assert.deepEqual(getPageHeading(path, data), { title })
  }
})

test("Excel import is identified before student detail routes", () => {
  assert.deepEqual(getPageHeading("/students/import", data), {
    title: "Excel 批次匯入學生",
    parent: { title: "學生管理", to: "/students" },
  })
  assert.deepEqual(getPageHeading("/students/student", data), {
    title: "00123 · 王同學",
    parent: { title: "學生管理", to: "/students" },
    section: "學生詳細資料",
  })
})

test("problem editor moves the entity title to the topbar while public detail keeps its own presentation", () => {
  assert.deepEqual(getPageHeading("/problems/new", data), {
    title: "新增題目",
    parent: { title: "題目管理", to: "/problems" },
  })
  assert.equal(getPageHeading("/problems/problem/edit", data).title, "P0001 · A + B")
  assert.equal(getPageHeading("/problems/problem/edit", data).section, "編輯題目")
  assert.equal(getPageHeading("/problems/problem/details", data).title, "題目詳情")
})

test("assignment child pages identify the selected assignment and editing context", () => {
  assert.equal(getPageHeading("/assignments/new", data).title, "新增作業")
  assert.equal(getPageHeading("/assignments/assignment", data).title, "HW01 · 第一次作業")
  assert.equal(getPageHeading("/assignments/assignment/edit", data).section, "編輯作業設定")
})

test("missing records and unknown routes retain a readable heading", () => {
  assert.equal(getPageHeading("/students/missing", data).title, "學生詳細資料")
  assert.equal(getPageHeading("/problems/missing/edit", data).title, "編輯題目")
  assert.equal(getPageHeading("/unknown", data).title, "工作區")
})

test("submission details return to the submission list", () => {
  assert.deepEqual(getPageHeading("/submissions/example", data), {
    title: "程式碼提交詳情",
    parent: { title: "繳交紀錄", to: "/submissions" },
  })
})
