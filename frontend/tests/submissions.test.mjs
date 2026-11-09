import assert from "node:assert/strict"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import test from "node:test"
import ts from "typescript"
import { createElement } from "react"
import { renderToString } from "react-dom/server"
import { createMemoryRouter, RouterProvider } from "react-router"

const output = resolve("node_modules/.tmp/submission-tests")
const compiled = new Set()
async function compile(name) {
  if (compiled.has(name)) return
  compiled.add(name)
  let source
  for (const extension of ["ts", "tsx"]) {
    try {
      source = await readFile(`src/${name}.${extension}`, "utf8")
      break
    } catch (error) {
      if (error.code !== "ENOENT") throw error
    }
  }
  assert.ok(source, `Missing source: ${name}`)
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2023,
      jsx: ts.JsxEmit.ReactJSX,
    },
  })
  const target = `${output}/${name}.mjs`
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, outputText.replace(/from "(\.\.?\/[^"\n]+)"/g, 'from "$1.mjs"'))
  for (const [, dependency] of outputText.matchAll(/from "(\.\.?\/[^"\n]+)"/g)) {
    const absolute = resolve(dirname(`src/${name}`), dependency)
    const relative = absolute.slice(resolve("src").length + 1).replaceAll("\\", "/")
    await compile(relative)
  }
}
async function load(name) {
  await compile(name)
  return import(pathToFileURL(`${output}/${name}.mjs`).href)
}

const { createSubmissionDemoWorkspace } = await load("data/grades/mockSubmissionWorkspace")
const { buildGradeBook } = await load("utils/grades/gradeCalculation")
const { isDemoGradeData } = await load("services/grades/gradeService")
const { GradeContext } = await load("hooks/grades/useGrades")
const { ManagementContext } = await load("hooks/useManagementStore")
const { StudentContext } = await load("components/students/StudentStore")
const { SubmissionListPage } = await load("pages/submissions/SubmissionListPage")
const { SubmissionDetailPage } = await load("pages/submissions/SubmissionDetailPage")
const now = Date.parse("2026-11-10T12:00:00Z")
function fixture() {
  const data = createSubmissionDemoWorkspace(now)
  return {
    data,
    input: { ...data.workspace.management, students: data.workspace.students, gradeData: data, now },
  }
}
function render(path, data) {
  const wrap = (page) =>
    createElement(
      GradeContext.Provider,
      {
        value: {
          data, workspace: data.workspace, now, demo: true, error: "", demoError: "",
          enableDemo() {}, exitDemo() {},
        },
      },
      createElement(
        ManagementContext.Provider,
        { value: { data: data.workspace.management, loadError: "", execute() {} } },
        createElement(
          StudentContext.Provider,
          { value: { students: data.workspace.students } },
          createElement(page),
        ),
      ),
    )
  const router = createMemoryRouter([
    { path: "/submissions", element: wrap(SubmissionListPage) },
    { path: "/submissions/:submissionId", element: wrap(SubmissionDetailPage) },
  ], { initialEntries: [path] })
  try {
    return renderToString(createElement(RouterProvider, { router }))
  } finally {
    router.dispose()
  }
}

test("submission demo validates and exposes every judge status without changing source records", () => {
  const { data, input } = fixture()
  const before = structuredClone(data)
  assert.equal(isDemoGradeData(data), true)
  const book = buildGradeBook(input)
  assert.ok(book.submissions.length > 90)
  assert.equal(new Set(book.submissions.flatMap((row) => row.run ? [row.run.status] : [])).size, 10)
  assert.ok(book.submissions.some((row) => row.validity?.includes("逾期")))
  assert.ok(book.submissions.some((row) => row.validity === "已作廢"))
  assert.deepEqual(data, before)
})

test("only the best valid submission per student and assignment question is counted", () => {
  const { input } = fixture()
  const book = buildGradeBook(input)
  const groups = Map.groupBy(book.submissions, (row) =>
    JSON.stringify([row.submission.studentId, row.submission.assignmentId, row.submission.assignmentProblemId]),
  )
  for (const rows of groups.values()) {
    const valid = rows.filter((row) => row.validity === null && row.score !== null)
    const counted = rows.filter((row) => row.counted)
    assert.equal(counted.length, valid.length ? 1 : 0)
    if (valid.length) assert.equal(counted[0].score, Math.max(...valid.map((row) => row.score)))
  }
})

test("submission list supports filters, sorting and page size through its URL", () => {
  const { data, input } = fixture()
  const row = buildGradeBook(input).submissions.find((item) => item.counted)
  const query = new URLSearchParams({
    student: row.student.id, assignment: row.assignment.id,
    problem: row.relation.id, counted: "yes", size: "100", sort: "-time",
  })
  const html = render(`/submissions?${query}`, data)
  assert.ok(html.includes(row.submission.id))
  assert.ok(html.includes("aria-sort=\"descending\""))
  assert.ok(html.includes("查看程式碼"))
  assert.ok(html.includes("測試資料模式"))
  const missing = render("/submissions?q=no-such-submission", data)
  assert.ok(missing.includes("沒有程式碼提交紀錄"))
})

test("submission details escape source code and display judge history; missing IDs show an empty state", () => {
  const { data } = fixture()
  const submission = data.submissions[0]
  submission.sourceCode = '<script>alert("unsafe")</script>'
  const html = render(`/submissions/${submission.id}`, data)
  assert.ok(html.includes("&lt;script&gt;"))
  assert.ok(!html.includes('<script>alert("unsafe")</script>'))
  assert.ok(html.includes("評測歷史"))
  assert.ok(html.includes("目前指定評測"))
  assert.ok(render("/submissions/missing", data).includes("找不到提交紀錄"))
})
