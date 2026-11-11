import assert from "node:assert/strict"
import { readFile, mkdir, writeFile } from "node:fs/promises"
import { resolve, dirname } from "node:path"
import { pathToFileURL } from "node:url"
import test from "node:test"
import ts from "typescript"

const output = resolve("node_modules/.tmp/problem-tests")
const modules = [
  "lib/uuid",
  "types/assignment",
  "types/problem",
  "types/testCase",
  "types/assignmentProblem",
  "types/specialRule",
  "data/problems/specialRuleCatalog",
  "utils/shared/assignmentSchema",
  "utils/problems/problemValidation",
  "utils/problems/problemOperations",
  "utils/problems/problemPresentation",
  "utils/problems/problemEditor",
  "utils/problems/specialRules",
  "services/shared/managementStorage",
]
for (const name of modules) {
  const source = await readFile(`src/${name}.ts`, "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 },
  })
  const target = `${output}/${name}.mjs`
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, outputText.replace(/from "(\.\.?\/[^"\n]+)"/g, 'from "$1.mjs"'))
}
const load = (name) => import(pathToFileURL(`${output}/${name}.mjs`).href)
const {
  emptyAssignmentData,
  isAssignmentData,
  migrateAssignmentData,
  loadAssignmentData,
  assignmentStorageKey,
} = await load("services/shared/managementStorage")
const { applyProblemAction: apply } = await load("utils/problems/problemOperations")
const { validateProblem, problemIssues } = await load("utils/problems/problemValidation")
const { publicProblemView } = await load("utils/problems/problemPresentation")
const { mergeProblemTab, problemTabDirty } = await load("utils/problems/problemEditor")
const draft = {
  code: "P001",
  title: "A + B",
  difficulty: "easy",
  tags: ["基礎"],
  statementMarkdown: "# A + B\n輸入兩數，輸出總和。",
  points: 100,
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  outputComparisonMode: "strict",
  allowedLanguages: ["Python 3"],
  similarityCheck: { enabled: false, threshold: 80 },
  specialRuleIds: [],
  specialRuleChecks: [],
}
const caseDraft = {
  name: "範例",
  input: " 1 2\r\n\n",
  expectedOutput: "3 \r\n",
  visibility: "public",
  enabled: true,
}
function setup() {
  const created = apply(emptyAssignmentData(), { type: "save-problem", draft })
  const problemId = created.id
  const result = apply(created.data, { type: "save-testcase", problemId, draft: caseDraft })
  return { data: result.data, problemId, testCaseId: result.id }
}
function referencedFixture() {
  const { data, problemId, testCaseId } = setup()
  const timestamp = "2026-11-01T00:00:00Z"
  data.assignments.push({
    id: "assignment",
    code: "HW01",
    title: "既有作業",
    description: "",
    startAt: timestamp,
    dueAt: "2026-12-01T00:00:00Z",
    status: "published",
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  data.assignmentProblems.push({
    id: "reference",
    assignmentId: "assignment",
    problemId,
    order: 0,
    points: 100,
    publishedSnapshot: {
      capturedAt: timestamp,
      problem: structuredClone(data.problems[0]),
      testCases: structuredClone(data.testCases),
      specialRules: [],
    },
  })
  return { data, problemId, testCaseId }
}

test("library CRUD and copying cases work independently of assignments", () => {
  const { data, problemId } = setup()
  const copy = apply(data, { type: "copy-problem", id: problemId })
  assert.notEqual(copy.id, problemId)
  assert.equal(copy.data.problems.length, 2)
  assert.equal(
    copy.data.testCases.find((item) => item.problemId === copy.id).input,
    caseDraft.input,
  )
  const deleted = apply(copy.data, { type: "delete-problem", id: problemId }).data
  assert.equal(deleted.problems.length, 1)
  assert.equal(deleted.testCases.length, 1)
  assert.ok(isAssignmentData(deleted))
  assert.equal(data.problems.length, 1)
  assert.equal("revision" in data.problems[0], false)
  assert.equal("revision" in copy.data.problems.find((item) => item.id === copy.id), false)
})

test("authoring validates a single language, limits, similarity and built-in rules", () => {
  for (const allowedLanguages of [[], ["Python 3", "C"], ["Java"]])
    assert.ok(validateProblem({ ...draft, allowedLanguages }).allowedLanguages)
  assert.ok(validateProblem({ ...draft, timeLimitMs: 0 }).timeLimitMs)
  assert.ok(
    validateProblem({ ...draft, similarityCheck: { enabled: true, threshold: 101 } })
      .similarityCheck,
  )
  assert.ok(
    validateProblem({
      ...draft,
      specialRuleChecks: [
        { feature: "for", mode: "required" },
        { feature: "for", mode: "forbidden" },
      ],
    }).specialRuleChecks,
  )
  const { data } = setup()
  assert.deepEqual(problemIssues(data.problems[0], data.testCases), [])
  assert.ok(problemIssues(data.problems[0], []).some((message) => message.includes("啟用測資")))
})

test("testcase drafts commit together with raw text, order and enable states intact", () => {
  const { data, problemId, testCaseId } = setup()
  let staged = apply(data, { type: "copy-testcase", id: testCaseId })
  const copiedId = staged.id
  staged = apply(staged.data, { type: "move-testcase", id: copiedId, delta: -1 })
  staged = apply(staged.data, { type: "toggle-testcase", id: testCaseId })
  const cases = staged.data.testCases.sort((a, b) => a.order - b.order)
  const committed = apply(data, { type: "save-testcases", problemId, cases }).data
  assert.deepEqual(
    committed.testCases.map((item) => item.id),
    [copiedId, testCaseId],
  )
  assert.equal(committed.testCases[1].enabled, false)
  assert.equal(committed.testCases[0].expectedOutput, caseDraft.expectedOutput)
  assert.equal(data.testCases[0].enabled, true)
  assert.equal(data.testCases.length, 1)
  assert.ok(isAssignmentData(committed))
  assert.throws(
    () => apply(data, { type: "save-testcases", problemId, cases: [{ ...cases[0], name: "" }] }),
    /TC01.*名稱/,
  )
  assert.throws(
    () => apply(data, { type: "save-testcases", problemId, cases: [cases[0], cases[0]] }),
    /重複/,
  )
})

test("public content includes configured rules and only enabled public cases", () => {
  const { data, problemId } = setup()
  const problem = {
    ...data.problems[0],
    specialRuleChecks: [
      { feature: "for", mode: "required" },
      { feature: "sorted", mode: "forbidden" },
    ],
  }
  const view = publicProblemView(problem, [
    ...data.testCases,
    { ...data.testCases[0], id: "hidden", visibility: "hidden", input: "HIDDEN_SECRET" },
    { ...data.testCases[0], id: "disabled", enabled: false, input: "DISABLED_SECRET" },
    { ...data.testCases[0], id: "foreign", problemId: "other", input: "FOREIGN_SECRET" },
  ])
  assert.equal(view.examples.length, 1)
  assert.equal(view.examples[0].input, caseDraft.input)
  assert.deepEqual(view.specialRules, { required: ["for 迴圈"], forbidden: ["sorted()"] })
  assert.equal(JSON.stringify(view).includes("SECRET"), false)
  assert.equal(data.problems[0].id, problemId)
})

test("reference protection and existing published snapshots survive library edits", () => {
  const { data, problemId, testCaseId } = referencedFixture()
  const snapshot = structuredClone(data.assignmentProblems[0].publishedSnapshot)
  assert.throws(() => apply(data, { type: "delete-problem", id: problemId }), /作業引用/)
  let result = apply(data, {
    type: "save-problem",
    id: problemId,
    draft: {
      ...draft,
      title: "新名稱",
      specialRuleChecks: [{ feature: "while", mode: "required" }],
    },
  })
  result = apply(result.data, { type: "toggle-testcase", id: testCaseId })
  assert.deepEqual(result.data.assignmentProblems[0].publishedSnapshot, snapshot)
  assert.ok(isAssignmentData(result.data))
})

test("tab changes are saved and discarded without changing other sections", () => {
  const changed = {
    ...draft,
    title: "新名稱",
    statementMarkdown: "新敘述",
    specialRuleChecks: [{ feature: "for", mode: "required" }],
  }
  const basic = mergeProblemTab("basic", changed, draft)
  assert.equal(basic.title, "新名稱")
  assert.equal(basic.statementMarkdown, draft.statementMarkdown)
  assert.deepEqual(basic.specialRuleChecks, [])
  assert.equal(problemTabDirty("basic", changed, basic), false)
  assert.equal(problemTabDirty("statement", changed, basic), true)
  assert.equal(problemTabDirty("overview", changed, draft), false)
  assert.deepEqual(mergeProblemTab("special-rules", draft, changed).specialRuleChecks, [])
})

test("older data remains readable and default settings upgrade with a backup", () => {
  const { data } = referencedFixture()
  data.testCases[0].weight = 20
  delete data.problems[0].specialRuleChecks
  const raw = JSON.stringify(data)
  const values = new Map([[assignmentStorageKey, raw]])
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  const loaded = loadAssignmentData()
  assert.deepEqual(loaded.problems[0].specialRuleChecks, [])
  assert.equal(values.get(`${assignmentStorageKey}-before-built-in-rules`), raw)
  assert.deepEqual(loadAssignmentData(), loaded)
  values.set(assignmentStorageKey, raw)
  globalThis.localStorage.setItem = () => {
    throw new Error("QuotaExceeded")
  }
  assert.throws(loadAssignmentData, /儲存失敗/)
  assert.equal(values.get(assignmentStorageKey), raw)
})

test("legacy migration preserves problem IDs, cases and fixed snapshots", () => {
  const { data, problemId } = referencedFixture()
  const { code, tags, difficulty, ...fields } = data.problems[0]
  const legacy = {
    version: 1,
    assignments: data.assignments,
    problems: [{ ...fields, assignmentId: "assignment", order: 0 }],
    testCases: data.testCases,
  }
  const migrated = migrateAssignmentData(legacy)
  assert.equal(migrated.problems[0].id, problemId)
  assert.equal(migrated.testCases[0].input, caseDraft.input)
  assert.equal(migrated.assignmentProblems[0].publishedSnapshot.problem.id, problemId)
  assert.ok(isAssignmentData(migrated))
})

test("obsolete version counters and assignment languages are removed with a recoverable backup", () => {
  const { data } = referencedFixture()
  data.problems[0].revision = 7
  data.assignments[0].allowedLanguages = ["C++"]
  data.assignmentProblems[0].publishedSnapshot.versionId = "old-publication:r3"
  data.assignmentProblems[0].publishedSnapshot.problem.revision = 3
  const raw = JSON.stringify(data)
  const values = new Map([[assignmentStorageKey, raw]])
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  const expected = structuredClone(data)
  delete expected.problems[0].revision
  delete expected.assignments[0].allowedLanguages
  delete expected.assignmentProblems[0].publishedSnapshot.versionId
  delete expected.assignmentProblems[0].publishedSnapshot.problem.revision
  const loaded = loadAssignmentData()
  assert.deepEqual(loaded, expected)
  assert.deepEqual(loaded.problems[0].allowedLanguages, ["Python 3"])
  assert.equal(loaded.assignmentProblems[0].publishedSnapshot.testCases[0].input, caseDraft.input)
  assert.equal(values.get(`${assignmentStorageKey}-before-metadata-removal`), raw)
  assert.deepEqual(loadAssignmentData(), loaded)
  values.set(assignmentStorageKey, raw)
  globalThis.localStorage.setItem = () => {
    throw new Error("QuotaExceeded")
  }
  assert.throws(loadAssignmentData, /儲存失敗/)
  assert.equal(values.get(assignmentStorageKey), raw)
})
