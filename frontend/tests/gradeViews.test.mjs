import assert from "node:assert/strict"
import { readFile, mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import test from "node:test"
import ts from "typescript"
import { createElement } from "react"
import { renderToString } from "react-dom/server"
import { createMemoryRouter, RouterProvider } from "react-router"

const output = resolve("node_modules/.tmp/grade-view-tests")
const modules = [
  "lib/uuid",
  "types/assignment",
  "types/judgeRun",
  "data/problems/specialRuleCatalog",
  "utils/assignments/assignmentOperations",
  "utils/assignments/assignmentValidation",
  "utils/assignments/gradingUtils",
  "utils/shared/assignmentSchema",
  "utils/problems/problemOperations",
  "utils/problems/problemValidation",
  "utils/problems/specialRules",
  "utils/grades/gradeCalculation",
  "utils/grades/gradeFormat",
  "services/grades/gradeService",
  "services/shared/managementStorage",
  "data/grades/mockGradeData",
  "data/grades/mockSubmissionWorkspace",
  "components/ui/styles",
  "layouts/navigation",
]
const jsxModules = [
  "hooks/useManagementStore",
  "hooks/grades/useGrades",
  "hooks/grades/useGradeFilters",
  "components/students/StudentStore",
  "components/shared/EmptyState",
  "components/shared/StatusBadge",
  "components/shared/Pagination",
  "components/shared/ConfirmDialog",
  "components/grades/GradeDataNotice",
  "components/layout/Sidebar",
  "components/grades/GradeUI",
  "components/grades/GradeTable",
  "components/grades/AssignmentGradeTable",
  "components/grades/StudentAssignmentGrades",
  "components/grades/SubmissionGradeTable",
  "components/grades/SubmissionGradeList",
  "pages/grades/GradesOverviewPage",
  "pages/grades/StudentGradesPage",
  "pages/grades/StudentGradeDetailPage",
  "pages/grades/AssignmentGradesPage",
  "pages/grades/AssignmentGradeDetailPage",
  "pages/grades/SubmissionGradesPage",
  "pages/submissions/SubmissionListPage",
  "pages/submissions/SubmissionDetailPage",
  "layouts/GradesLayout",
]
for (const [name, extension] of [
  ...modules.map((name) => [name, "ts"]),
  ...jsxModules.map((name) => [
    name,
    name === "hooks/grades/useGrades" ||
    name === "hooks/grades/useGradeFilters" ||
    name === "hooks/useManagementStore"
      ? "ts"
      : "tsx",
  ]),
]) {
  const { outputText } = ts.transpileModule(await readFile(`src/${name}.${extension}`, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2023,
      jsx: ts.JsxEmit.ReactJSX,
    },
  })
  const target = `${output}/${name}.mjs`
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, outputText.replace(/from "(\.\.?\/[^"\n]+)"/g, 'from "$1.mjs"'))
}
const load = (name) => import(pathToFileURL(`${output}/${name}.mjs`).href)
const { applyAssignmentAction: apply } = await load("utils/assignments/assignmentOperations")
const { buildGradeBook, assessmentKey, getStudentGradeSummary } = await load(
  "utils/grades/gradeCalculation",
)
const {
  emptyGradeData,
  loadGradeData,
  saveGradeData,
  isGradeData,
  gradeStorageKey,
  gradeDemoStorageKey,
  loadDemoGradeData,
  saveDemoGradeData,
  isDemoGradeData,
} = await load("services/grades/gradeService")
const { createDemoGradeData } = await load("data/grades/mockGradeData")
const { createSubmissionDemoWorkspace } = await load("data/grades/mockSubmissionWorkspace")
const { gradeText } = await load("utils/grades/gradeFormat")
const now = Date.parse("2026-11-09T12:00:00Z")
const assignmentDraft = {
  code: "HW03",
  title: "第三次作業",
  description: "",
  startAt: "2026-11-01T00:00:00Z",
  dueAt: "2026-11-08T12:00:00Z",
}
const problemDraft = {
  code: "P001",
  title: "加法",
  difficulty: "easy",
  tags: [],
  statementMarkdown: "輸入兩數，輸出總和。",
  points: 100,
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  outputComparisonMode: "strict",
  allowedLanguages: ["Python 3"],
  similarityCheck: { enabled: false, threshold: 80 },
  specialRuleIds: [],
  specialRuleChecks: [],
}

function fixture() {
  let data = {
    version: 2,
    assignments: [],
    problems: [],
    assignmentProblems: [],
    testCases: [],
    specialRules: [],
  }
  let result = apply(data, { type: "save-assignment", draft: assignmentDraft })
  const assignmentId = result.id
  data = result.data
  for (let index = 0; index < 3; index++) {
    result = apply(data, {
      type: "save-problem",
      draft: { ...problemDraft, code: `P00${index + 1}` },
    })
    const problemId = result.id
    result = apply(result.data, {
      type: "save-testcase",
      problemId,
      draft: {
        name: "範例",
        input: "1 2",
        expectedOutput: "3",
        visibility: "public",
        enabled: true,
      },
    })
    result = apply(result.data, { type: "add-problems", assignmentId, problemIds: [problemId] })
    data = apply(result.data, {
      type: "set-problem-points",
      id: result.id,
      points: [40, 30, 30][index],
    }).data
  }
  data = apply(data, { type: "status", id: assignmentId, status: "published" }).data
  const students = ["王小明", "陳小華", "林小美", "張同學"].map((name, index) => ({
    id: `student-${index}`,
    studentNumber: `0011559800${index + 1}`,
    name,
    className: index < 2 ? "資工一甲" : "資工一乙",
    active: index !== 3,
    email: "",
    notes: "",
    createdAt: assignmentDraft.startAt,
    updatedAt: assignmentDraft.startAt,
  }))
  const gradeData = {
    ...emptyGradeData(),
    policies: [{ assignmentId, countLate: false }],
  }
  return { ...data, students, gradeData, now }
}

function submit(input, studentIndex = 0, problemIndex = 0, options = {}) {
  const relation = input.assignmentProblems
    .filter((item) => item.assignmentId === (options.assignmentId ?? input.assignments[0].id))
    .sort((a, b) => a.order - b.order)[problemIndex]
  const id = `submission-${input.gradeData.submissions.length}`
  const status = options.status ?? "AC"
  const pending = ["Pending", "Judging", "SE"].includes(status)
  const submission = {
    id,
    studentId: input.students[studentIndex].id,
    assignmentId: relation.assignmentId,
    assignmentProblemId: relation.id,
    language: "Python 3",
    sourceCode: "print(3)\n",
    submittedAt:
      options.submittedAt ??
      `2026-11-02T00:00:${String(input.gradeData.submissions.length).padStart(2, "0")}Z`,
    submissionNumber:
      input.gradeData.submissions.filter(
        (item) =>
          item.studentId === input.students[studentIndex].id &&
          item.assignmentProblemId === relation.id,
      ).length + 1,
    accepted: true,
    deleted: false,
    voided: false,
    currentJudgeRunId: `${id}-run`,
    ...(options.submission ?? {}),
  }
  const run = {
    id: `${id}-run`,
    submissionId: id,
    status,
    score: pending ? null : (options.score ?? (status === "AC" ? 100 : 0)),
    maxScore: 100,
    judgedAt: pending ? null : submission.submittedAt,
    valid: true,
    assessmentKey: assessmentKey(relation),
    testCaseResults: [],
    ...(options.run ?? {}),
  }
  input.gradeData.submissions.push(submission)
  input.gradeData.judgeRuns.push(run)
  return { submission, run }
}

function scenario() {
  const input = fixture()
  for (const question of [0, 1, 2]) submit(input, 0, question)
  submit(input, 0, 0, { status: "Partial", score: 60 })
  submit(input, 1, 0, { status: "Partial", score: 60 })
  submit(input, 1, 1)
  submit(input, 2, 1, { status: "CE" })
  return input
}

test("empty formal records show all students without inventing scores or submissions", () => {
  const input = fixture()
  const book = buildGradeBook(input)
  assert.equal(book.submissions.length, 0)
  assert.equal(book.assignments[0].rows.length, 4)
  assert.equal(book.assignments[0].unsubmittedStudents, 4)
  for (const row of book.assignments[0].rows) {
    assert.equal(row.score, null)
    assert.equal(row.state, "unsubmitted")
    assert.equal(row.submitted, 0)
  }
  assert.equal(input.gradeData.submissions.length, 0)
})

test("submitted distinct questions, full-score questions, and attempt counts remain separate", () => {
  const input = scenario()
  const original = structuredClone(input)
  const summary = buildGradeBook(input).assignments[0]
  assert.deepEqual(
    summary.rows.map((row) => row.submitted),
    [3, 2, 1, 0],
  )
  assert.deepEqual(
    summary.rows.map((row) => row.completed),
    [3, 1, 0, 0],
  )
  assert.deepEqual(
    summary.rows.map((row) => row.submissionCount),
    [4, 2, 1, 0],
  )
  assert.deepEqual(
    summary.rows.map((row) => row.score),
    [100, 54, 0, null],
  )
  assert.equal(summary.submittedStudents, 3)
  assert.equal(summary.submittedProblems, 6)
  assert.deepEqual(input, original)
})

test("best score normalizes to assignment points and ties choose the earlier submission", () => {
  const input = fixture()
  const first = submit(input, 0, 0, { status: "Partial", score: 40 })
  const best = submit(input, 0, 0, { status: "Partial", score: 80 })
  submit(input, 0, 0, { status: "Partial", score: 60 })
  submit(input, 0, 0, { status: "Partial", score: 80 })
  const book = buildGradeBook(input)
  const grade = book.students[0].assignments[0].problems[0]
  assert.equal(grade.score, 32)
  assert.equal(grade.best.submission.id, best.submission.id)
  assert.equal(book.submissions.filter((view) => view.counted).length, 1)
  assert.equal(
    book.submissions.find((view) => view.submission.id === first.submission.id).counted,
    false,
  )
})

test("all accepted pending and failing verdicts count as submitted, including a valid zero", () => {
  for (const status of ["Pending", "Judging", "WA", "CE", "TLE", "MLE", "RE", "SE"]) {
    const input = fixture()
    submit(input, 0, 0, { status })
    const row = buildGradeBook(input).assignments[0].rows[0]
    assert.equal(row.submitted, 1, status)
    assert.equal(row.completed, 0, status)
    assert.equal(row.submissionCount, 1, status)
    assert.equal(row.score, ["Pending", "Judging", "SE"].includes(status) ? null : 0, status)
    assert.equal(
      gradeText(row.score, row.state),
      ["Pending", "Judging"].includes(status) ? "待評測" : status === "SE" ? "評測異常" : "0",
    )
  }
})

test("pending scores never become zero and prior valid best results survive other pending submissions", () => {
  const input = fixture()
  submit(input, 0, 0, { status: "Partial", score: 80 })
  submit(input, 0, 0, { status: "Pending" })
  assert.equal(buildGradeBook(input).assignments[0].rows[0].score, 32)
  submit(input, 0, 1, { status: "Pending" })
  assert.equal(buildGradeBook(input).assignments[0].rows[0].score, null)
  assert.equal(buildGradeBook(input).assignments[0].rows[0].state, "pending")
})

test("rejected, voided, deleted, early, late, future and wrong-language submissions are excluded consistently", () => {
  for (const options of [
    { submission: { accepted: false } },
    { submission: { voided: true } },
    { submission: { deleted: true } },
    { submittedAt: "2026-10-30T00:00:00Z" },
    { submittedAt: "2026-11-09T00:00:00Z" },
    { submittedAt: "2026-11-10T00:00:00Z" },
    { submission: { language: "C" } },
    { submission: { studentId: "missing" } },
    { submission: { assignmentProblemId: "missing" } },
  ]) {
    const input = fixture()
    submit(input, 0, 0, options)
    const book = buildGradeBook(input)
    assert.equal(book.assignments[0].rows[0].submitted, 0)
    assert.equal(book.assignments[0].rows[0].submissionCount, 0)
    assert.equal(book.submissions[0].counted, false)
    assert.ok(book.submissions[0].validity)
  }
  const input = fixture()
  input.gradeData.policies = []
  submit(input)
  const book = buildGradeBook(input)
  assert.equal(book.assignments[0].rows.length, input.students.length)
  assert.equal(book.submissions[0].validity, null)
})

test("late policy is explicit, deadline inclusive, and inactive roster members remain included", () => {
  const input = fixture()
  submit(input, 0, 0, { submittedAt: assignmentDraft.dueAt })
  submit(input, 1, 0, { submittedAt: "2026-11-09T00:00:00Z" })
  assert.deepEqual(
    buildGradeBook(input).assignments[0].rows.map((row) => row.submitted),
    [1, 0, 0, 0],
  )
  input.gradeData.policies[0].countLate = true
  assert.deepEqual(
    buildGradeBook(input).assignments[0].rows.map((row) => row.submitted),
    [1, 1, 0, 0],
  )
  assert.equal(buildGradeBook(input).assignments[0].rows[3].student.active, false)
})

test("only the designated valid judge run is used, historical runs remain available", () => {
  const input = fixture()
  const { submission, run } = submit(input)
  const replacement = { ...run, id: "rejudge", status: "Partial", score: 50 }
  input.gradeData.judgeRuns.push(replacement)
  submission.currentJudgeRunId = replacement.id
  assert.equal(buildGradeBook(input).assignments[0].rows[0].score, 20)
  replacement.status = "SE"
  replacement.score = null
  assert.equal(buildGradeBook(input).assignments[0].rows[0].score, null)
  assert.equal(input.gradeData.judgeRuns.length, 2)
})

test("invalid or mismatched assessments cannot award scores or full completion", () => {
  for (const run of [
    { valid: false },
    { assessmentKey: "outdated" },
    { score: 101 },
    { maxScore: 0 },
    { score: NaN },
    { score: -1 },
    { status: "AC", score: 60 },
    { judgedAt: "2026-11-10T00:00:00Z" },
    { judgedAt: "2026-10-01T00:00:00Z" },
    { submissionId: "other" },
  ]) {
    const input = fixture()
    submit(input, 0, 0, { run })
    const row = buildGradeBook(input).assignments[0].rows[0]
    assert.equal(row.submitted, 1)
    assert.equal(row.completed, 0)
    assert.equal(row.score, null)
  }
})

test("published assessment is independent of later library changes and same problem in another assignment", () => {
  const input = fixture()
  submit(input)
  input.problems[0].statementMarkdown = "改寫題庫"
  input.problems[0].points = 999
  const copied = apply(input, { type: "copy-assignment", id: input.assignments[0].id })
  const published = apply(copied.data, { type: "status", id: copied.id, status: "published" })
  input.assignments = published.data.assignments
  input.assignmentProblems = published.data.assignmentProblems
  input.gradeData.policies.push({
    assignmentId: copied.id,
    countLate: false,
  })
  const book = buildGradeBook(input)
  assert.equal(book.assignments[0].rows[0].score, 40)
  assert.equal(
    book.assignments[0].rows[0].problems[0].problem.statementMarkdown,
    problemDraft.statementMarkdown,
  )
  assert.equal(book.assignments[1].rows[0].submitted, 0)
  assert.equal(book.assignments[1].rows[0].score, null)
})

test("averages normalize different assignment totals, expose samples, and exclude unfinished assessments", () => {
  const input = fixture()
  submit(input, 0, 0)
  submit(input, 1, 0, { status: "Pending" })
  submit(input, 2, 0, { status: "CE" })
  const book = buildGradeBook(input)
  assert.equal(book.assignments[0].sampleSize, 2)
  assert.equal(book.assignments[0].averageRate, 20)
  assert.equal(book.assignments[0].unresolvedStudents, 1)
  assert.equal(book.students[2].averageRate, 0)
  assert.equal(book.students[2].sampleSize, 1)
  assert.equal(book.students[3].averageRate, null)
  assert.equal(book.students[3].sampleSize, 0)
  const row = book.assignments[0].rows[0]
  const summary = getStudentGradeSummary(
    input.students[0],
    [row, { ...row, score: 20, maxScore: 40 }],
    now,
  )
  assert.equal(summary.averageRate, 45)
  assert.equal(summary.sampleSize, 2)
  const missing = { ...row, score: null, state: "unsubmitted" }
  const withMissing = getStudentGradeSummary(input.students[0], [row, missing], now)
  assert.equal(withMissing.averageRate, 40)
  assert.equal(withMissing.sampleSize, 1)
  const ongoing = { ...row, assignment: { ...row.assignment, dueAt: "2026-12-01T00:00:00Z" } }
  assert.equal(getStudentGradeSummary(input.students[0], [ongoing], now).sampleSize, 0)
})

test("all students participate without roster configuration while draft and snapshot protections remain", () => {
  const input = fixture()
  input.gradeData.policies = []
  submit(input)
  assert.equal(buildGradeBook(input).assignments[0].rows.length, input.students.length)
  assert.equal(buildGradeBook(input).assignments[0].rows[0].score, 40)
  assert.equal(buildGradeBook(input).assignments[0].rows[3].score, null)
  assert.equal(buildGradeBook(input).assignments[0].rows[3].student.active, false)
  input.assignments[0].status = "draft"
  assert.equal(buildGradeBook(input).assignments[0].rows[0].state, "unavailable")
  input.assignments[0].status = "published"
  delete input.assignmentProblems[0].publishedSnapshot
  assert.equal(buildGradeBook(input).assignments[0].rows[0].score, null)
})

test("grade storage preserves submissions, validates malformed data, and never overwrites corrupt originals", () => {
  const input = scenario()
  const values = new Map()
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  const updated = structuredClone(input.gradeData)
  saveGradeData(updated)
  assert.deepEqual(loadGradeData(), updated)
  assert.deepEqual(updated.submissions, input.gradeData.submissions)
  assert.ok(isGradeData(updated))
  for (const malformed of [
    { ...updated, version: 2 },
    { ...updated, submissions: [...updated.submissions, updated.submissions[0]] },
    { ...updated, judgeRuns: [{ ...updated.judgeRuns[0], status: "INVALID" }] },
  ])
    assert.equal(isGradeData(malformed), false)
  values.set(gradeStorageKey, '{"broken": true}')
  assert.throws(loadGradeData, /格式/)
  assert.equal(values.get(gradeStorageKey), '{"broken": true}')
  globalThis.localStorage.setItem = () => {
    throw new Error("QuotaExceeded")
  }
  assert.throws(() => saveGradeData(updated), /無法儲存/)
})

test("legacy roster settings are removed with a backup while submissions, scores and timing rules stay intact", () => {
  const input = scenario()
  input.gradeData.policies[0].studentIds = [input.students[0].id]
  input.gradeData.policies[0].countLate = true
  const raw = JSON.stringify(input.gradeData)
  const values = new Map([[gradeStorageKey, raw]])
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  const loaded = loadGradeData()
  assert.equal("studentIds" in loaded.policies[0], false)
  assert.equal(loaded.policies[0].countLate, true)
  assert.deepEqual(loaded.submissions, input.gradeData.submissions)
  assert.deepEqual(loaded.judgeRuns, input.gradeData.judgeRuns)
  assert.equal(values.get(`${gradeStorageKey}-before-roster-removal`), raw)
  assert.deepEqual(loadGradeData(), loaded)
  const book = buildGradeBook({ ...input, gradeData: loaded })
  assert.equal(book.assignments[0].rows.length, input.students.length)
  assert.deepEqual(
    book.assignments[0].rows.map((row) => row.score),
    [100, 54, 0, null],
  )
  assert.equal(JSON.parse(values.get(gradeStorageKey)).policies[0].studentIds, undefined)
})

test("legacy demo restrictions disappear without changing the test workspace or formal data", () => {
  const demo = createSubmissionDemoWorkspace(now)
  demo.policies = [
    {
      assignmentId: demo.workspace.management.assignments[0].id,
      studentIds: ["obsolete-student"],
      countLate: false,
    },
  ]
  const raw = JSON.stringify(demo)
  const session = new Map([[gradeDemoStorageKey, raw]])
  const formal = JSON.stringify(fixture().gradeData)
  const live = new Map([[gradeStorageKey, formal]])
  globalThis.sessionStorage = {
    getItem: (key) => session.get(key) ?? null,
    setItem: (key, value) => session.set(key, value),
    removeItem: (key) => session.delete(key),
  }
  globalThis.localStorage = {
    getItem: (key) => live.get(key) ?? null,
    setItem: (key, value) => live.set(key, value),
  }
  const loaded = loadDemoGradeData()
  assert.equal("studentIds" in loaded.policies[0], false)
  assert.deepEqual(loaded.workspace, demo.workspace)
  assert.deepEqual(loaded.submissions, demo.submissions)
  assert.equal(session.get(`${gradeDemoStorageKey}-before-roster-removal`), raw)
  assert.equal(live.get(gradeStorageKey), formal)
  assert.deepEqual(loadDemoGradeData(), loaded)
})

test("roster cleanup failures preserve original formal and demo records", () => {
  const input = fixture()
  input.gradeData.policies[0].studentIds = [input.students[0].id]
  const raw = JSON.stringify(input.gradeData)
  const values = new Map([
    [gradeStorageKey, raw],
    [gradeDemoStorageKey, raw],
  ])
  const failOnCurrentRecord = (key, value) => {
    if ([gradeStorageKey, gradeDemoStorageKey].includes(key)) throw new Error("QuotaExceeded")
    values.set(key, value)
  }
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: failOnCurrentRecord,
  }
  globalThis.sessionStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: failOnCurrentRecord,
  }
  assert.throws(loadGradeData, /清理失敗/)
  assert.throws(loadDemoGradeData, /清理失敗/)
  assert.equal(values.get(gradeStorageKey), raw)
  assert.equal(values.get(gradeDemoStorageKey), raw)
  assert.equal(values.get(`${gradeStorageKey}-before-roster-removal`), raw)
  assert.equal(values.get(`${gradeDemoStorageKey}-before-roster-removal`), raw)
})

test("explicit demo records reference existing entities and leave formal input untouched", () => {
  const input = fixture()
  const original = structuredClone(input)
  const demo = createDemoGradeData(input)
  assert.ok(isGradeData(demo))
  const book = buildGradeBook({ ...input, gradeData: demo })
  assert.deepEqual(
    book.assignments[0].rows.map((row) => row.submitted),
    [3, 2, 1, 0],
  )
  assert.equal(book.assignments[0].rows[0].problems[0].score, 32)
  assert.deepEqual(input, original)
  assert.ok(demo.submissions.every((item) => item.id.startsWith("demo-")))
  const withoutPolicies = createDemoGradeData({ ...input, gradeData: emptyGradeData() })
  assert.equal(withoutPolicies.submissions.length, demo.submissions.length)
})

test("demonstration records survive refresh separately from formal data and can be exited", () => {
  const input = fixture()
  const demo = createDemoGradeData(input)
  const sessionValues = new Map()
  const liveValues = new Map([[gradeStorageKey, JSON.stringify(input.gradeData)]])
  globalThis.localStorage = {
    getItem: (key) => liveValues.get(key) ?? null,
    setItem: (key, value) => liveValues.set(key, value),
  }
  globalThis.sessionStorage = {
    getItem: (key) => sessionValues.get(key) ?? null,
    setItem: (key, value) => sessionValues.set(key, value),
    removeItem: (key) => sessionValues.delete(key),
  }
  saveDemoGradeData(demo)
  assert.deepEqual(loadDemoGradeData(), demo)
  assert.deepEqual(loadGradeData(), input.gradeData)
  assert.equal(sessionValues.has(gradeStorageKey), false)
  assert.equal(liveValues.has(gradeDemoStorageKey), false)
  saveDemoGradeData(null)
  assert.equal(loadDemoGradeData(), null)
  assert.deepEqual(loadGradeData(), input.gradeData)
  sessionValues.set(gradeDemoStorageKey, "invalid JSON")
  assert.throws(loadDemoGradeData, /示範資料讀取失敗/)
  assert.deepEqual(loadGradeData(), input.gradeData)
})

test("rounding cannot turn a nearly full score into a completed problem or break best-score selection", () => {
  const input = fixture()
  submit(input, 0, 0, { status: "Partial", score: 99.999999 })
  assert.equal(buildGradeBook(input).assignments[0].rows[0].completed, 0)
  const full = submit(input, 0, 0)
  const row = buildGradeBook(input).assignments[0].rows[0]
  assert.equal(row.completed, 1)
  assert.equal(row.problems[0].best.submission.id, full.submission.id)
})

test("submission demo loads a complete standalone workspace without any existing students or assignments", () => {
  const demo = createSubmissionDemoWorkspace(now)
  assert.ok(isDemoGradeData(demo))
  assert.equal(demo.workspace.students.length, 24)
  assert.equal(demo.workspace.management.assignments.length, 3)
  assert.equal(demo.workspace.management.problems.length, 3)
  assert.equal(demo.submissions.length, 101)
  const book = buildGradeBook({
    ...demo.workspace.management,
    students: demo.workspace.students,
    gradeData: demo,
    now,
  })
  assert.deepEqual(
    book.assignments[0].rows.slice(0, 4).map((row) => row.submitted),
    [3, 2, 1, 0],
  )
  assert.equal(book.assignments[0].rows[0].problems[0].score, 32)
  assert.equal(
    book.assignments[0].rows[0].problems[0].submissions.filter((view) => view.validity === null)
      .length,
    3,
  )
  assert.equal(book.assignments[0].rows[8].completed, 3)
  assert.equal(book.assignments[0].rows[8].score, 100)
  assert.equal(book.assignments[2].submittedStudents, 0)
  assert.equal(
    book.submissions.find((view) => view.submission.id === "demo-late").validity,
    "逾期，不列入採計",
  )
  assert.equal(
    book.submissions.find((view) => view.submission.id === "demo-voided").validity,
    "已作廢",
  )
  assert.deepEqual(
    new Set(demo.judgeRuns.map((run) => run.status)),
    new Set(["Pending", "Judging", "AC", "Partial", "WA", "TLE", "MLE", "RE", "CE", "SE"]),
  )
  assert.ok(demo.judgeRuns.length > new Set(demo.judgeRuns.map((run) => run.submissionId)).size)
})

test("standalone demo entity graph survives refresh and cannot overwrite live data or accept orphaned IDs", () => {
  const live = fixture()
  const original = JSON.stringify(live.gradeData)
  const values = new Map([[gradeStorageKey, original]])
  const session = new Map()
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  globalThis.sessionStorage = {
    getItem: (key) => session.get(key) ?? null,
    setItem: (key, value) => session.set(key, value),
    removeItem: (key) => session.delete(key),
  }
  const demo = createSubmissionDemoWorkspace(now)
  saveDemoGradeData(demo)
  assert.deepEqual(loadDemoGradeData(), demo)
  assert.equal(values.get(gradeStorageKey), original)
  const broken = structuredClone(demo)
  broken.workspace.students = []
  assert.equal(isDemoGradeData(broken), false)
  assert.throws(() => saveDemoGradeData(broken), /示範資料格式/)
  assert.deepEqual(loadDemoGradeData(), demo)
  saveDemoGradeData(null)
  assert.deepEqual(loadGradeData(), live.gradeData)
})

test("standalone demo pages use their own linked entities while the live workspace stays empty", async () => {
  const demo = createSubmissionDemoWorkspace(now)
  const live = {
    ...fixture(),
    students: [],
    assignments: [],
    assignmentProblems: [],
    problems: [],
    gradeData: emptyGradeData(),
  }
  const original = structuredClone(live)
  const list = await gradePageRouter(live, "/submissions", demo)
  assert.ok(list.render().includes("王小明"))
  assert.ok(list.render().includes("測試資料模式"))
  list.router.dispose()
  const detail = await gradePageRouter(
    live,
    `/grades/assignments/${demo.workspace.management.assignments[0].id}`,
    demo,
  )
  assert.ok(!detail.render().includes("匯出 Excel"))
  assert.ok(!detail.render().includes("找不到作業"))
  detail.router.dispose()
  const code = await gradePageRouter(live, `/submissions/${demo.submissions[0].id}`, demo)
  assert.ok(code.render().includes("評測歷史"))
  assert.ok(code.render().includes("print(a + b)"))
  code.router.dispose()
  assert.deepEqual(live, original)
})

async function gradePageRouter(input, initialEntry, demoData) {
  const { GradeContext } = await load("hooks/grades/useGrades")
  const { ManagementContext } = await load("hooks/useManagementStore")
  const { StudentContext } = await load("components/students/StudentStore")
  const { GradesLayout } = await load("layouts/GradesLayout")
  const pages = [
    ["", "GradesOverviewPage"],
    ["students", "StudentGradesPage"],
    ["students/:studentId", "StudentGradeDetailPage"],
    ["assignments", "AssignmentGradesPage"],
    ["assignments/:assignmentId", "AssignmentGradeDetailPage"],
    ["submissions", "SubmissionGradesPage"],
  ]
  const children = []
  for (const [path, name] of pages) {
    const module = await load(`pages/grades/${name}`)
    children.push({ ...(path ? { path } : { index: true }), element: createElement(module[name]) })
  }
  const { SubmissionDetailPage } = await load("pages/submissions/SubmissionDetailPage")
  const { SubmissionListPage } = await load("pages/submissions/SubmissionListPage")
  const router = createMemoryRouter(
    [
      { path: "/grades", element: createElement(GradesLayout), children },
      { path: "/submissions", element: createElement(SubmissionListPage) },
      { path: "/submissions/:submissionId", element: createElement(SubmissionDetailPage) },
    ],
    { initialEntries: [initialEntry] },
  )
  const store = {
    data: demoData ?? input.gradeData,
    workspace: demoData?.workspace,
    error: "",
    demoError: "",
    demo: !!demoData,
    now: input.now,
    enableDemo() {},
    exitDemo() {},
  }
  const render = () =>
    renderToString(
      createElement(
        ManagementContext.Provider,
        { value: { data: input, loadError: "", execute() {} } },
        createElement(
          StudentContext.Provider,
          { value: { students: input.students } },
          createElement(
            GradeContext.Provider,
            { value: store },
            createElement(RouterProvider, { router }),
          ),
        ),
      ),
    )
  return { router, render }
}

test("all six grade pages render from direct URLs with shared source data and preserve router history", async () => {
  const input = scenario()
  for (const path of [
    "/grades",
    "/grades/students",
    `/grades/students/${input.students[0].id}`,
    "/grades/assignments",
    `/grades/assignments/${input.assignments[0].id}`,
    "/grades/submissions",
  ]) {
    const page = await gradePageRouter(input, path)
    const html = page.render()
    assert.ok(html.includes("成績總覽"), path)
    assert.ok(html.includes("學生成績"), path)
    assert.ok(html.includes("作業成績"), path)
    assert.ok(html.includes("提交成績"), path)
    assert.ok(!html.includes("找不到"), path)
    assert.ok(!html.includes("設定應繳"), path)
    assert.ok(!html.includes("請先設定名單"), path)
    page.router.dispose()
  }
  const page = await gradePageRouter(input, "/grades/students?q=王小明&mode=progress")
  assert.ok(page.render().includes("王小明"))
  assert.ok(!page.render().includes("陳小華"))
  await page.router.navigate(`/grades/students/${input.students[0].id}`)
  assert.ok(page.render().includes("已完成題數"))
  await page.router.navigate(-1)
  assert.equal(new URLSearchParams(page.router.state.location.search).get("q"), "王小明")
  assert.equal(new URLSearchParams(page.router.state.location.search).get("mode"), "progress")
  assert.ok(page.render().includes("王小明"))
  page.router.dispose()
})

test("missing IDs, empty submission states and source-code escaping render safely", async () => {
  const input = fixture()
  for (const [path, expected] of [
    ["/grades/students/missing", "找不到學生"],
    ["/grades/assignments/missing", "找不到作業"],
    ["/submissions/missing", "找不到提交紀錄"],
    ["/grades/submissions", "沒有程式碼提交紀錄"],
    ["/grades", "尚無程式碼提交"],
  ]) {
    const page = await gradePageRouter(input, path)
    assert.ok(page.render().includes(expected), path)
    page.router.dispose()
  }
  const { submission } = submit(input, 0, 0, {
    submission: { sourceCode: '<script>alert("x")</script>\nprint(3)' },
  })
  const page = await gradePageRouter(input, `/submissions/${submission.id}`)
  const html = page.render()
  assert.ok(html.includes("&lt;script&gt;"))
  assert.ok(!html.includes('<script>alert("x")'))
  assert.ok(html.includes("本題採計"))
  page.router.dispose()
})
