import assert from "node:assert/strict"
import { readFile, mkdir, writeFile } from "node:fs/promises"
import { resolve, dirname } from "node:path"
import { pathToFileURL } from "node:url"
import test from "node:test"
import ts from "typescript"

const output = resolve("node_modules/.tmp/assignment-tests-v2")
const modules = [
  "types/assignment",
  "types/problem",
  "types/testCase",
  "types/assignmentProblem",
  "types/specialRule",
  "data/problems/specialRuleCatalog",
  "utils/assignments/gradingUtils",
  "utils/assignments/assignmentValidation",
  "utils/assignments/assignmentOperations",
  "utils/assignments/assignmentViews",
  "utils/assignments/assignmentEditor",
  "utils/shared/assignmentSchema",
  "utils/problems/problemValidation",
  "utils/problems/problemOperations",
  "utils/problems/problemPresentation",
  "utils/problems/problemEditor",
  "utils/problems/specialRules",
  "services/shared/managementStorage",
  "services/assignments/assignmentStorage",
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
  assignmentStorageKey,
  loadAssignmentData,
  saveAssignmentData,
} = await load("services/assignments/assignmentStorage")
const { applyAssignmentAction: apply } = await load("utils/assignments/assignmentOperations")
const { publishIssues, validateAssignment } = await load("utils/assignments/assignmentValidation")
const { problemIssues, validateProblem, validateTestCase } = await load(
  "utils/problems/problemValidation",
)
const { configuredProblems } = await load("utils/assignments/assignmentViews")
const { problemLabel } = await load("utils/assignments/gradingUtils")
const { assignmentInput, assignmentProblemInputs, assignmentSaveDraft } = await load(
  "utils/assignments/assignmentEditor",
)
const { publicProblemView } = await load("utils/problems/problemPresentation")
const { specialRuleCatalog } = await load("data/problems/specialRuleCatalog")
const { problemTabDirty, mergeProblemTab } = await load("utils/problems/problemEditor")
const assignmentDraft = {
  code: "HW03",
  title: "測試作業",
  description: "",
  startAt: "2026-11-01T00:00:00Z",
  dueAt: "2026-12-01T00:00:00Z",
}
const problemDraft = {
  code: "P001",
  title: "A + B",
  difficulty: "easy",
  tags: ["基礎", "加法"],
  statementMarkdown: "# A + B\n\n輸入兩數，輸出總和。",
  points: 50,
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  outputComparisonMode: "strict",
  allowedLanguages: ["Python 3"],
  similarityCheck: { enabled: false, threshold: 80 },
  specialRuleIds: [],
  specialRuleChecks: [],
}
const caseDraft = {
  name: "TC01",
  input: " 1 2\r\n\n",
  expectedOutput: "3 \r\n",
  visibility: "hidden",
  enabled: true,
}
function setup() {
  let result = apply(emptyAssignmentData(), { type: "save-assignment", draft: assignmentDraft })
  const assignmentId = result.id
  result = apply(result.data, { type: "save-problem", draft: problemDraft })
  const problemId = result.id
  result = apply(result.data, { type: "save-testcase", problemId, draft: caseDraft })
  const testCaseId = result.id
  result = apply(result.data, { type: "add-problems", assignmentId, problemIds: [problemId] })
  return { data: result.data, assignmentId, problemId, testCaseId, relationId: result.id }
}
function legacyFixture(status = "published") {
  const { data, assignmentId, problemId } = setup()
  const { code, tags, difficulty, ...fields } = data.problems[0]
  return {
    version: 1,
    assignments: data.assignments.map((item) => ({ ...item, status })),
    problems: [{ ...fields, assignmentId, order: 0 }],
    testCases: data.testCases,
  }
}

test("independent library problem can be saved with no assignment", () => {
  const result = apply(emptyAssignmentData(), { type: "save-problem", draft: problemDraft })
  assert.equal(result.data.assignments.length, 0)
  assert.equal(result.data.assignmentProblems.length, 0)
  assert.equal(result.data.problems[0].assignmentId, undefined)
  assert.ok(isAssignmentData(result.data))
})

test("one save commits assignment information, additions, removals, order and points together", () => {
  const { data, assignmentId, problemId, relationId } = setup()
  const second = apply(data, { type: "save-problem", draft: { ...problemDraft, code: "P002" } })
  const third = apply(second.data, {
    type: "save-problem",
    draft: { ...problemDraft, code: "P003" },
  })
  const other = apply(third.data, { type: "copy-assignment", id: assignmentId })
  const untouched = structuredClone(
    other.data.assignmentProblems.filter((item) => item.assignmentId === other.id),
  )
  const original = structuredClone(other.data)
  const saved = apply(other.data, {
    type: "save-assignment",
    id: assignmentId,
    draft: { ...assignmentDraft, title: "統一儲存" },
    problemConfiguration: [
      { problemId: second.id, points: 30 },
      { problemId, points: 70 },
    ],
  })
  assert.equal(saved.data.assignments.find((item) => item.id === assignmentId).title, "統一儲存")
  assert.deepEqual(assignmentProblemInputs(assignmentId, saved.data.assignmentProblems), [
    { problemId: second.id, points: "30" },
    { problemId, points: "70" },
  ])
  assert.equal(
    saved.data.assignmentProblems.find(
      (item) => item.assignmentId === assignmentId && item.problemId === problemId,
    ).id,
    relationId,
  )
  assert.deepEqual(
    saved.data.assignmentProblems.filter((item) => item.assignmentId === other.id),
    untouched,
  )
  assert.deepEqual(saved.data.problems, original.problems)
  assert.deepEqual(saved.data.testCases, original.testCases)
  assert.deepEqual(other.data, original)
  const removed = apply(saved.data, {
    type: "save-assignment",
    id: assignmentId,
    draft: assignmentDraft,
    problemConfiguration: [],
  })
  assert.equal(assignmentProblemInputs(assignmentId, removed.data.assignmentProblems).length, 0)
  assert.equal(removed.data.problems.length, 3)
  assert.ok(isAssignmentData(saved.data))
  assert.ok(isAssignmentData(removed.data))
})

test("invalid combined saves never partially update assignment metadata or its configuration", () => {
  const { data, assignmentId, problemId } = setup()
  const original = structuredClone(data)
  for (const problemConfiguration of [
    [
      { problemId, points: 30 },
      { problemId, points: 70 },
    ],
    [{ problemId: "missing", points: 100 }],
    [{ problemId, points: 0 }],
    [{ problemId, points: -1 }],
    [{ problemId, points: NaN }],
    [{ problemId, points: Infinity }],
  ]) {
    assert.throws(() =>
      apply(data, {
        type: "save-assignment",
        id: assignmentId,
        draft: { ...assignmentDraft, title: "不得局部儲存" },
        problemConfiguration,
      }),
    )
    assert.deepEqual(data, original)
  }
})

test("combined configuration saves cannot bypass published or archived locks", () => {
  const { data, assignmentId, problemId } = setup()
  const published = apply(data, { type: "status", id: assignmentId, status: "published" })
  const original = structuredClone(published.data)
  for (const problemConfiguration of [[], [{ problemId, points: 200 }]]) {
    assert.throws(
      () =>
        apply(published.data, {
          type: "save-assignment",
          id: assignmentId,
          draft: assignmentDraft,
          problemConfiguration,
        }),
      /不可修改題目配置/,
    )
    assert.deepEqual(published.data, original)
  }
  const archived = apply(published.data, { type: "status", id: assignmentId, status: "archived" })
  assert.deepEqual(archived.data.assignmentProblems, original.assignmentProblems)
  assert.throws(
    () =>
      apply(archived.data, {
        type: "save-assignment",
        id: assignmentId,
        draft: assignmentDraft,
        problemConfiguration: [],
      }),
    /封存作業為唯讀/,
  )
})

test("archiving a draft fixes its content until it is explicitly restored", () => {
  const { data, assignmentId, problemId } = setup()
  const archived = apply(data, { type: "status", id: assignmentId, status: "archived" })
  const frozen = structuredClone(configuredProblems(archived.data, archived.data.assignments[0])[0])
  const changed = apply(archived.data, {
    type: "save-problem",
    id: problemId,
    draft: { ...problemDraft, statementMarkdown: "題庫後續修改", points: 200 },
  })
  const repeated = apply(changed.data, { type: "status", id: assignmentId, status: "archived" })
  assert.deepEqual(configuredProblems(repeated.data, repeated.data.assignments[0])[0], frozen)
  const restored = apply(repeated.data, { type: "status", id: assignmentId, status: "draft" })
  assert.equal(
    configuredProblems(restored.data, restored.data.assignments[0])[0].problem.statementMarkdown,
    "題庫後續修改",
  )
  assert.equal(restored.data.assignmentProblems[0].publishedSnapshot, undefined)
  assert.ok(isAssignmentData(restored.data))
})

test("inline editing preserves precise unchanged timestamps and uses the latest unchanged deadline", () => {
  const { data } = setup()
  const current = {
    ...data.assignments[0],
    startAt: "2026-11-01T00:00:15.123Z",
    dueAt: "2026-12-01T00:00:47.456Z",
  }
  const baseline = assignmentInput(current)
  const changed = assignmentSaveDraft({ ...baseline, title: " 新名稱 " }, baseline, current)
  assert.equal(changed.title, "新名稱")
  assert.equal(changed.startAt, current.startAt)
  assert.equal(changed.dueAt, current.dueAt)
  const published = { ...current, status: "published", dueAt: "2026-12-08T00:00:47.456Z" }
  const saved = assignmentSaveDraft({ ...baseline, title: "只改名稱" }, baseline, published)
  assert.equal(saved.dueAt, published.dueAt)
  assert.equal(saved.startAt, published.startAt)
})

test("saving and discarding a problem tab affect only its own fields", () => {
  const draft = {
    ...problemDraft,
    title: "新名稱",
    statementMarkdown: "新敘述",
    similarityCheck: { enabled: true, threshold: 70 },
    specialRuleChecks: [{ feature: "for", mode: "required" }],
  }
  const original = structuredClone(problemDraft)
  for (const tab of ["basic", "statement", "special-rules"]) {
    assert.equal(problemTabDirty(tab, draft, problemDraft), true)
    const saved = mergeProblemTab(tab, draft, problemDraft)
    assert.equal(problemTabDirty(tab, draft, saved), false)
    const reverted = mergeProblemTab(tab, problemDraft, draft)
    assert.equal(problemTabDirty(tab, reverted, problemDraft), false)
  }
  const basic = mergeProblemTab("basic", draft, problemDraft)
  assert.equal(basic.title, "新名稱")
  assert.equal(basic.statementMarkdown, problemDraft.statementMarkdown)
  assert.deepEqual(basic.specialRuleChecks, [])
  const statement = mergeProblemTab("statement", draft, problemDraft)
  assert.equal(statement.title, problemDraft.title)
  assert.equal(statement.statementMarkdown, "新敘述")
  assert.deepEqual(statement.similarityCheck, problemDraft.similarityCheck)
  const rules = mergeProblemTab("special-rules", draft, problemDraft)
  assert.equal(rules.title, problemDraft.title)
  assert.deepEqual(rules.specialRuleChecks, draft.specialRuleChecks)
  assert.equal(problemTabDirty("overview", draft, problemDraft), false)
  assert.equal(problemTabDirty("testcases", draft, problemDraft), false)
  assert.deepEqual(problemDraft, original)
})

test("testcase tab commits its complete draft once and preserves other problems and published snapshots", () => {
  const { data, assignmentId, problemId, testCaseId } = setup()
  let result = apply(data, { type: "copy-problem", id: problemId })
  const otherId = result.id
  const source = apply(result.data, { type: "status", id: assignmentId, status: "published" }).data
  const snapshot = structuredClone(source.assignmentProblems[0].publishedSnapshot)
  const otherCases = structuredClone(source.testCases.filter((item) => item.problemId === otherId))
  result = apply(source, {
    type: "save-testcase",
    problemId,
    draft: { ...caseDraft, name: "新增一" },
  })
  const firstId = result.id
  result = apply(result.data, {
    type: "save-testcase",
    problemId,
    draft: { ...caseDraft, name: "新增二" },
  })
  const secondId = result.id
  result = apply(result.data, { type: "delete-testcase", id: testCaseId })
  result = apply(result.data, { type: "move-testcase", id: secondId, delta: -1 })
  result = apply(result.data, { type: "toggle-testcase", id: firstId })
  const cases = result.data.testCases
    .filter((item) => item.problemId === problemId)
    .sort((a, b) => a.order - b.order)
  assert.equal(source.testCases.filter((item) => item.problemId === problemId).length, 1)
  const committed = apply(source, { type: "save-testcases", problemId, cases }).data
  const saved = committed.testCases.filter((item) => item.problemId === problemId)
  assert.deepEqual(
    saved.map((item) => item.id),
    [secondId, firstId],
  )
  assert.deepEqual(
    saved.map((item) => item.order),
    [0, 1],
  )
  assert.equal(saved[1].enabled, false)
  assert.equal(saved[0].input, caseDraft.input)
  assert.equal(saved[0].expectedOutput, caseDraft.expectedOutput)
  assert.equal("revision" in committed.problems.find((item) => item.id === problemId), false)
  assert.deepEqual(
    committed.testCases.filter((item) => item.problemId === otherId),
    otherCases,
  )
  assert.deepEqual(committed.assignmentProblems[0].publishedSnapshot, snapshot)
  assert.ok(isAssignmentData(committed))
  assert.equal(
    apply(committed, { type: "save-testcases", problemId, cases: [] }).data.testCases.filter(
      (item) => item.problemId === problemId,
    ).length,
    0,
  )
})

test("testcase tab rejects duplicate or foreign IDs and invalid drafts without changing saved data", () => {
  const { data, problemId } = setup()
  const original = structuredClone(data)
  const item = data.testCases[0]
  for (const cases of [
    [item, item],
    [{ ...item, problemId: "foreign" }],
    [{ ...item, id: "" }],
    [{ ...item, visibility: "invalid" }],
    [{ ...item, name: " " }],
  ]) {
    assert.throws(() => apply(data, { type: "save-testcases", problemId, cases }))
    assert.deepEqual(data, original)
  }
  assert.throws(
    () => apply(data, { type: "save-testcases", problemId, cases: [{ ...item, name: "" }] }),
    /TC01.*名稱/,
  )
  const copied = apply(data, { type: "copy-problem", id: problemId }).data
  const foreignCase = copied.testCases.find((entry) => entry.problemId !== problemId)
  assert.throws(
    () =>
      apply(copied, {
        type: "save-testcases",
        problemId,
        cases: [{ ...item, id: foreignCase.id }],
      }),
    /重複/,
  )
})

test("authoring requires exactly one language, while old records and frozen snapshots stay readable", () => {
  for (const allowedLanguages of [[], ["Python 3", "C"], ["Python 3", "Python 3"], ["Java"]]) {
    assert.ok(validateProblem({ ...problemDraft, allowedLanguages }).allowedLanguages)
    assert.throws(
      () =>
        apply(emptyAssignmentData(), {
          type: "save-problem",
          draft: { ...problemDraft, allowedLanguages },
        }),
      /一種/,
    )
  }
  const { data, assignmentId, problemId } = setup()
  const published = apply(data, { type: "status", id: assignmentId, status: "published" }).data
  published.problems[0].allowedLanguages = ["Python 3", "C"]
  published.assignmentProblems[0].publishedSnapshot.problem.allowedLanguages = ["Python 3", "C"]
  published.assignmentProblems[0].publishedSnapshot.problem.summary = "舊摘要"
  assert.ok(isAssignmentData(published))
  const snapshot = structuredClone(published.assignmentProblems[0].publishedSnapshot)
  const updated = apply(published, {
    type: "save-problem",
    id: problemId,
    draft: { ...problemDraft, allowedLanguages: ["C"] },
  }).data
  assert.deepEqual(updated.problems[0].allowedLanguages, ["C"])
  assert.deepEqual(updated.assignmentProblems[0].publishedSnapshot, snapshot)
  assert.ok(isAssignmentData(updated))
  assert.equal("summary" in publicProblemView(snapshot.problem, snapshot.testCases), false)
  const legacy = legacyFixture()
  legacy.problems[0].allowedLanguages = ["Python 3", "C"]
  const migrated = migrateAssignmentData(legacy)
  assert.deepEqual(migrated.problems[0].allowedLanguages, ["Python 3", "C"])
  assert.deepEqual(migrated.assignmentProblems[0].publishedSnapshot.problem.allowedLanguages, [
    "Python 3",
    "C",
  ])
})

test("assignments do not restrict languages; each problem keeps its own single language", () => {
  const { data, assignmentId, problemId } = setup()
  assert.equal("allowedLanguages" in data.assignments[0], false)
  let result = apply(data, {
    type: "save-problem",
    draft: { ...problemDraft, code: "P002", allowedLanguages: ["C"] },
  })
  const secondId = result.id
  result = apply(result.data, { type: "save-testcase", problemId: secondId, draft: caseDraft })
  result = apply(result.data, { type: "add-problems", assignmentId, problemIds: [secondId] })
  const published = apply(result.data, {
    type: "status",
    id: assignmentId,
    status: "published",
  }).data
  assert.equal(published.assignmentProblems.length, 2)
  assert.equal(published.assignments[0].status, "published")
  assert.deepEqual(published.problems.find((item) => item.id === problemId).allowedLanguages, [
    "Python 3",
  ])
  assert.deepEqual(published.problems.find((item) => item.id === secondId).allowedLanguages, ["C"])
  assert.ok(isAssignmentData(published))
})

test("public problem is composed of its statement and only enabled public cases", () => {
  const { data, problemId } = setup()
  const problem = data.problems[0]
  const cases = [
    ...data.testCases,
    {
      ...data.testCases[0],
      id: "public2",
      name: "第二組",
      visibility: "public",
      order: 2,
      input: " 2 3\r\n",
      expectedOutput: "5 \n",
    },
    {
      ...data.testCases[0],
      id: "public1",
      name: "第一組",
      visibility: "public",
      order: 1,
      input: "",
      expectedOutput: "",
    },
    {
      ...data.testCases[0],
      id: "disabled",
      visibility: "public",
      enabled: false,
      input: "DISABLED_SECRET",
    },
    {
      ...data.testCases[0],
      id: "foreign",
      problemId: "another",
      visibility: "public",
      input: "FOREIGN_SECRET",
    },
  ]
  const view = publicProblemView(problem, cases)
  assert.equal(view.statementMarkdown, problem.statementMarkdown)
  assert.deepEqual(
    view.examples.map((item) => item.name),
    ["第一組", "第二組"],
  )
  assert.equal(view.examples[0].input, "")
  assert.equal(view.examples[1].input, " 2 3\r\n")
  assert.equal(view.examples[1].expectedOutput, "5 \n")
  assert.deepEqual(Object.keys(view.examples[0]), ["name", "input", "expectedOutput"])
  assert.ok(!JSON.stringify(view).includes("DISABLED_SECRET"))
  assert.ok(!JSON.stringify(view).includes("FOREIGN_SECRET"))
  assert.ok(!JSON.stringify(view).includes(caseDraft.input))
  assert.equal(publicProblemView({ ...problemDraft }, cases).examples.length, 0)
  const edited = publicProblemView(
    { ...problem, title: "未儲存名稱", statementMarkdown: "# 未儲存說明" },
    cases,
  )
  assert.equal(edited.title, "未儲存名稱")
  assert.equal(edited.statementMarkdown, "# 未儲存說明")
  assert.equal(data.problems.find((item) => item.id === problemId).title, problemDraft.title)
})
test("public overview groups only configured rules and reflects unsaved rule changes", () => {
  const draft = {
    ...problemDraft,
    specialRuleChecks: [
      { feature: "sorted", mode: "forbidden" },
      { feature: "recursion", mode: "required" },
      { feature: "for", mode: "required" },
    ],
  }
  const original = structuredClone(draft)
  assert.deepEqual(publicProblemView(draft, []).specialRules, {
    required: ["for 迴圈", "遞迴"],
    forbidden: ["sorted()"],
  })
  const edited = { ...draft, specialRuleChecks: [{ feature: "while", mode: "forbidden" }] }
  assert.deepEqual(publicProblemView(edited, []).specialRules, {
    required: [],
    forbidden: ["while 迴圈"],
  })
  assert.deepEqual(publicProblemView(problemDraft, []).specialRules, {
    required: [],
    forbidden: [],
  })
  assert.deepEqual(draft, original)
})

test("same problem supports multiple assignments with independent scores", () => {
  const { data, assignmentId, problemId, relationId } = setup()
  let result = apply(data, { type: "save-assignment", draft: { ...assignmentDraft, code: "HW04" } })
  const second = result.id
  result = apply(result.data, {
    type: "add-problems",
    assignmentId: second,
    problemIds: [problemId],
  })
  result = apply(result.data, { type: "set-problem-points", id: relationId, points: 30 })
  assert.equal(
    result.data.assignmentProblems.find((item) => item.assignmentId === assignmentId).points,
    30,
  )
  assert.equal(
    result.data.assignmentProblems.find((item) => item.assignmentId === second).points,
    50,
  )
  assert.equal(result.data.problems[0].points, 50)
  assert.equal(data.assignmentProblems[0].points, 50)
})
test("adding same problem again, including duplicate selections, is idempotent", () => {
  const { data, assignmentId, problemId } = setup()
  const result = apply(data, {
    type: "add-problems",
    assignmentId,
    problemIds: [problemId, problemId],
  })
  assert.equal(result.data.assignmentProblems.length, 1)
  assert.throws(
    () => apply(data, { type: "add-problems", assignmentId, problemIds: ["missing"] }),
    /不存在/,
  )
})
test("published snapshot stays fixed after library content, grading and case edits", () => {
  const { data, assignmentId, problemId, testCaseId } = setup()
  let result = apply(data, { type: "status", id: assignmentId, status: "published" })
  const original = structuredClone(result.data.assignmentProblems[0].publishedSnapshot)
  result = apply(result.data, {
    type: "save-problem",
    id: problemId,
    draft: {
      ...problemDraft,
      title: "修改後",
      statementMarkdown: "# New",
      points: 80,
      timeLimitMs: 2000,
      outputComparisonMode: "normalize-newlines",
    },
  })
  result = apply(result.data, {
    type: "save-testcase",
    problemId,
    id: testCaseId,
    draft: { ...caseDraft, input: "new\n", expectedOutput: "different" },
  })
  assert.deepEqual(result.data.assignmentProblems[0].publishedSnapshot, original)
  const view = configuredProblems(result.data, result.data.assignments[0])[0]
  assert.equal(view.frozen, true)
  assert.equal(view.problem.title, problemDraft.title)
  assert.equal(view.testCases[0].input, caseDraft.input)
  assert.equal(view.problem.outputComparisonMode, "strict")
  assert.equal(view.problem.timeLimitMs, 1000)
  assert.ok(isAssignmentData(result.data))
})
test("published configuration stays locked; republishing captures current content without version counters", () => {
  const { data, assignmentId, problemId, relationId } = setup()
  const published = apply(data, { type: "status", id: assignmentId, status: "published" }).data
  assert.throws(
    () => apply(published, { type: "set-problem-points", id: relationId, points: 10 }),
    /先取消發布/,
  )
  assert.throws(
    () =>
      apply(published, {
        type: "save-assignment",
        id: assignmentId,
        draft: { ...assignmentDraft, code: "CHANGED" },
      }),
    /不可修改作業編號/,
  )
  assert.throws(
    () => apply(published, { type: "remove-assignment-problem", id: relationId }),
    /先取消發布/,
  )
  const changed = apply(published, {
    type: "save-problem",
    id: problemId,
    draft: { ...problemDraft, title: "題庫新版本" },
  }).data
  const draft = apply(changed, { type: "status", id: assignmentId, status: "draft" }).data
  assert.equal(configuredProblems(draft, draft.assignments[0])[0].problem.title, "題庫新版本")
  const again = apply(draft, { type: "status", id: assignmentId, status: "published" }).data
  assert.equal(published.assignmentProblems[0].publishedSnapshot.problem.title, problemDraft.title)
  assert.equal("versionId" in again.assignmentProblems[0].publishedSnapshot, false)
  assert.equal("revision" in again.assignmentProblems[0].publishedSnapshot.problem, false)
  assert.equal(again.assignmentProblems[0].publishedSnapshot.problem.title, "題庫新版本")
})
test("published assignment information can change without touching frozen grading content", () => {
  const { data, assignmentId, problemId } = setup()
  const published = apply(data, { type: "status", id: assignmentId, status: "published" }).data
  const snapshot = structuredClone(published.assignmentProblems[0].publishedSnapshot)
  const libraryChanged = apply(published, {
    type: "save-problem",
    id: problemId,
    draft: { ...problemDraft, statementMarkdown: "", points: 200 },
  }).data
  const original = structuredClone(libraryChanged)
  const edited = apply(libraryChanged, {
    type: "save-assignment",
    id: assignmentId,
    draft: {
      ...assignmentDraft,
      title: "更新作業名稱",
      description: "補充一般說明",
      dueAt: "2026-12-05T00:00:00Z",
    },
  }).data
  assert.equal(edited.assignments[0].title, "更新作業名稱")
  assert.equal(edited.assignments[0].description, "補充一般說明")
  assert.equal(edited.assignments[0].dueAt, "2026-12-05T00:00:00Z")
  assert.equal(edited.assignments[0].status, "published")
  assert.equal(edited.assignments[0].code, assignmentDraft.code)
  assert.equal(edited.assignments[0].startAt, assignmentDraft.startAt)
  assert.deepEqual(edited.assignmentProblems[0].publishedSnapshot, snapshot)
  assert.deepEqual(edited.problems, libraryChanged.problems)
  assert.deepEqual(edited.testCases, libraryChanged.testCases)
  assert.deepEqual(libraryChanged, original)
  assert.ok(isAssignmentData(edited))
})

test("shortening a published deadline requires confirmation of the exact old and new times", () => {
  const { data, assignmentId } = setup()
  const published = apply(data, { type: "status", id: assignmentId, status: "published" }).data
  const original = structuredClone(published)
  const draft = { ...assignmentDraft, title: "提早截止", dueAt: "2026-11-28T15:00:00Z" }
  const action = { type: "save-assignment", id: assignmentId, draft }
  assert.throws(() => apply(published, action), /縮短截止時間/)
  for (const deadlineConfirmation of [
    { previousDueAt: "2026-12-02T00:00:00Z", nextDueAt: draft.dueAt },
    { previousDueAt: assignmentDraft.dueAt, nextDueAt: "2026-11-27T15:00:00Z" },
    { previousDueAt: "invalid", nextDueAt: draft.dueAt },
  ])
    assert.throws(() => apply(published, { ...action, deadlineConfirmation }), /重新確認/)
  assert.deepEqual(published, original)
  const saved = apply(published, {
    ...action,
    deadlineConfirmation: { previousDueAt: assignmentDraft.dueAt, nextDueAt: draft.dueAt },
  }).data
  assert.equal(saved.assignments[0].dueAt, draft.dueAt)
  assert.equal(saved.assignments[0].title, draft.title)
  assert.equal(saved.assignments[0].status, "published")
  assert.deepEqual(saved.assignmentProblems, original.assignmentProblems)
  assert.ok(isAssignmentData(saved))
})

test("a deadline confirmation becomes invalid if the deadline changes before saving", () => {
  const { data, assignmentId } = setup()
  const published = apply(data, { type: "status", id: assignmentId, status: "published" }).data
  const deadlineConfirmation = {
    previousDueAt: assignmentDraft.dueAt,
    nextDueAt: "2026-11-28T00:00:00Z",
  }
  const extended = apply(published, {
    type: "save-assignment",
    id: assignmentId,
    draft: { ...assignmentDraft, dueAt: "2026-12-08T00:00:00Z" },
  }).data
  const original = structuredClone(extended)
  assert.throws(
    () =>
      apply(extended, {
        type: "save-assignment",
        id: assignmentId,
        draft: { ...assignmentDraft, dueAt: deadlineConfirmation.nextDueAt },
        deadlineConfirmation,
      }),
    /重新確認/,
  )
  assert.deepEqual(extended, original)
})

test("published immutable settings and all archived information remain protected", () => {
  const { data, assignmentId, problemId, relationId } = setup()
  const published = apply(data, { type: "status", id: assignmentId, status: "published" }).data
  assert.throws(
    () =>
      apply(published, {
        type: "save-assignment",
        id: assignmentId,
        draft: { ...assignmentDraft, code: "NEW" },
      }),
    /不可修改作業編號/,
  )
  assert.throws(
    () =>
      apply(published, {
        type: "save-assignment",
        id: assignmentId,
        draft: { ...assignmentDraft, startAt: "2026-11-02T00:00:00Z" },
      }),
    /不可修改開放時間/,
  )
  assert.throws(
    () => apply(published, { type: "add-problems", assignmentId, problemIds: [problemId] }),
    /草稿狀態/,
  )
  assert.throws(
    () => apply(published, { type: "move-assignment-problem", id: relationId, delta: 1 }),
    /草稿狀態/,
  )
  const sameTime = apply(published, {
    type: "save-assignment",
    id: assignmentId,
    draft: { ...assignmentDraft, title: "同一時刻", startAt: "2026-11-01T08:00:00+08:00" },
  }).data
  assert.equal(sameTime.assignments[0].startAt, assignmentDraft.startAt)
  const archived = apply(published, { type: "status", id: assignmentId, status: "archived" }).data
  assert.throws(
    () =>
      apply(archived, {
        type: "save-assignment",
        id: assignmentId,
        draft: { ...assignmentDraft, title: "封存後更名", dueAt: "2026-12-08T00:00:00Z" },
      }),
    /封存作業為唯讀/,
  )
  assert.throws(
    () =>
      apply(published, {
        type: "save-assignment",
        id: assignmentId,
        draft: { ...assignmentDraft, dueAt: assignmentDraft.startAt },
        deadlineConfirmation: {
          previousDueAt: assignmentDraft.dueAt,
          nextDueAt: assignmentDraft.startAt,
        },
      }),
    /截止時間必須晚於開放時間/,
  )
})

test("publication checks completeness, enabled cases and positive assignment scores", () => {
  const { data, assignmentId, problemId, testCaseId } = setup()
  assert.equal(
    publishIssues(
      data.assignments[0],
      data.assignments,
      data.problems,
      data.testCases,
      data.assignmentProblems,
    ).length,
    0,
  )
  let changed = apply(data, { type: "toggle-testcase", id: testCaseId }).data
  assert.throws(
    () => apply(changed, { type: "status", id: assignmentId, status: "published" }),
    /啟用測資/,
  )
  changed = apply(data, {
    type: "save-problem",
    id: problemId,
    draft: { ...problemDraft, allowedLanguages: ["C"], statementMarkdown: "" },
  }).data
  assert.ok(
    publishIssues(
      changed.assignments[0],
      changed.assignments,
      changed.problems,
      changed.testCases,
      changed.assignmentProblems,
    ).some((issue) => issue.message.includes("題目敘述")),
  )
  assert.throws(
    () => apply(data, { type: "set-problem-points", id: data.assignmentProblems[0].id, points: 0 }),
    /大於 0/,
  )
  assert.ok(validateAssignment({ ...assignmentDraft, dueAt: assignmentDraft.startAt }, []).dueAt)
  assert.ok(validateProblem({ ...problemDraft, difficulty: "invalid" }).difficulty)
  assert.ok(validateTestCase({ ...caseDraft, visibility: "invalid" }).visibility)
  assert.equal(problemIssues(data.problems[0], data.testCases).length, 0)
})

test("cases without weights can be saved and published; older weighted data stays readable", () => {
  const { data, assignmentId, problemId, testCaseId } = setup()
  assert.equal("weight" in data.testCases[0], false)
  const multiple = apply(data, {
    type: "save-testcase",
    problemId,
    draft: { ...caseDraft, name: "第二筆測資" },
  }).data
  assert.ok(isAssignmentData(multiple))
  assert.equal(
    apply(multiple, { type: "status", id: assignmentId, status: "published" }).data.assignments[0]
      .status,
    "published",
  )
  const old = structuredClone(multiple)
  old.testCases[0].weight = 20
  old.testCases[1].weight = 30
  const published = apply(old, { type: "status", id: assignmentId, status: "published" }).data
  const snapshot = structuredClone(published.assignmentProblems[0].publishedSnapshot)
  const raw = JSON.stringify(published)
  globalThis.localStorage = {
    getItem: (key) => (key === assignmentStorageKey ? raw : null),
    setItem: () => {
      throw new Error("Unexpected migration")
    },
  }
  assert.deepEqual(loadAssignmentData(), published)
  const changed = apply(published, {
    type: "save-testcase",
    problemId,
    id: testCaseId,
    draft: { ...caseDraft, input: "新輸入\n" },
  }).data
  assert.deepEqual(changed.assignmentProblems[0].publishedSnapshot, snapshot)
  assert.ok(isAssignmentData(changed))
})
test("referenced problems cannot be deleted; assignment removal never deletes library content", () => {
  const { data, assignmentId, problemId } = setup()
  assert.throws(() => apply(data, { type: "delete-problem", id: problemId }), /作業引用/)
  const deleted = apply(data, { type: "delete-assignment", id: assignmentId }).data
  assert.equal(deleted.assignmentProblems.length, 0)
  assert.equal(deleted.problems.length, 1)
  assert.equal(deleted.testCases.length, 1)
  const final = apply(deleted, { type: "delete-problem", id: problemId }).data
  assert.equal(final.problems.length, 0)
  assert.equal(final.testCases.length, 0)
})
test("copy assignment shares library IDs; copy problem duplicates independent testcases", () => {
  const { data, assignmentId, problemId } = setup()
  const copied = apply(data, { type: "copy-assignment", id: assignmentId }).data
  assert.equal(copied.problems.length, 1)
  assert.equal(copied.assignmentProblems.length, 2)
  assert.equal(copied.assignmentProblems[0].problemId, copied.assignmentProblems[1].problemId)
  const libraryCopy = apply(copied, { type: "copy-problem", id: problemId })
  assert.notEqual(libraryCopy.id, problemId)
  assert.equal(libraryCopy.data.problems.length, 2)
  assert.equal(libraryCopy.data.testCases.length, 2)
  assert.equal(
    libraryCopy.data.testCases.find((item) => item.problemId === libraryCopy.id).input,
    caseDraft.input,
  )
})
test("assignment order changes locally without altering library or another assignment", () => {
  const { data, assignmentId, problemId } = setup()
  let result = apply(data, { type: "copy-problem", id: problemId })
  const second = result.id
  result = apply(result.data, { type: "add-problems", assignmentId, problemIds: [second] })
  const secondRelation = result.id
  result = apply(result.data, { type: "move-assignment-problem", id: secondRelation, delta: -1 })
  assert.equal(configuredProblems(result.data, result.data.assignments[0])[0].problem.id, second)
  result = apply(result.data, { type: "remove-assignment-problem", id: secondRelation })
  assert.equal(result.data.assignmentProblems[0].order, 0)
  assert.equal(result.data.problems.length, 2)
  assert.equal(problemLabel(26), "AA")
})
test("legacy migration preserves IDs, input/output whitespace, scores and published snapshots", () => {
  const legacy = legacyFixture()
  const migrated = migrateAssignmentData(legacy)
  assert.equal(migrated.version, 2)
  assert.equal(migrated.problems[0].id, legacy.problems[0].id)
  assert.equal(migrated.problems[0].assignmentId, undefined)
  assert.equal(migrated.assignmentProblems[0].points, legacy.problems[0].points)
  assert.equal(migrated.testCases[0].input, caseDraft.input)
  assert.equal(migrated.testCases[0].expectedOutput, caseDraft.expectedOutput)
  assert.equal(migrated.assignmentProblems[0].publishedSnapshot.problem.id, legacy.problems[0].id)
  assert.equal(
    migrateAssignmentData(legacyFixture("draft")).assignmentProblems[0].publishedSnapshot,
    undefined,
  )
  assert.ok(isAssignmentData(migrated))
})
test("storage migration keeps v1 backup, is repeatable, and preserves original on write failure", () => {
  const legacy = JSON.stringify(legacyFixture())
  const values = new Map([["just-coding-assignments-v1", legacy]])
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  const first = loadAssignmentData()
  assert.equal(values.get("just-coding-assignments-v1"), legacy)
  assert.ok(values.has(assignmentStorageKey))
  assert.deepEqual(loadAssignmentData(), first)
  values.delete(assignmentStorageKey)
  globalThis.localStorage.setItem = () => {
    throw new Error("QuotaExceeded")
  }
  assert.throws(loadAssignmentData, /儲存失敗/)
  assert.equal(values.get("just-coding-assignments-v1"), legacy)
  assert.equal(values.has(assignmentStorageKey), false)
})
test("storage rejects corrupt snapshots, duplicate links and orphan relations without overwriting", () => {
  const { data, assignmentId } = setup()
  assert.equal(
    isAssignmentData({
      ...data,
      assignmentProblems: [
        ...data.assignmentProblems,
        { ...data.assignmentProblems[0], id: "other" },
      ],
    }),
    false,
  )
  assert.equal(
    isAssignmentData({
      ...data,
      assignmentProblems: [{ ...data.assignmentProblems[0], problemId: "missing" }],
    }),
    false,
  )
  const published = apply(data, { type: "status", id: assignmentId, status: "published" }).data
  const broken = structuredClone(published)
  delete broken.assignmentProblems[0].publishedSnapshot
  assert.equal(isAssignmentData(broken), false)
  let raw = JSON.stringify(broken)
  globalThis.localStorage = {
    getItem: () => raw,
    setItem: () => {
      raw = "overwritten"
    },
  }
  assert.throws(loadAssignmentData, /損壞/)
  assert.notEqual(raw, "overwritten")
  globalThis.localStorage.setItem = () => {
    throw new Error("QuotaExceeded")
  }
  assert.throws(() => saveAssignmentData(data), /儲存失敗/)
})

test("similarity settings validate thresholds and remain frozen in published snapshots", () => {
  const { data, problemId, assignmentId } = setup()
  assert.ok(
    validateProblem({ ...problemDraft, similarityCheck: { enabled: true, threshold: 101 } })
      .similarityCheck,
  )
  assert.ok(
    validateProblem({ ...problemDraft, similarityCheck: { enabled: true, threshold: 50.5 } })
      .similarityCheck,
  )
  let result = apply(data, {
    type: "save-problem",
    id: problemId,
    draft: { ...problemDraft, similarityCheck: { enabled: true, threshold: 85 } },
  })
  result = apply(result.data, { type: "status", id: assignmentId, status: "published" })
  result = apply(result.data, {
    type: "save-problem",
    id: problemId,
    draft: { ...problemDraft, similarityCheck: { enabled: true, threshold: 70 } },
  })
  assert.equal(
    result.data.assignmentProblems[0].publishedSnapshot.problem.similarityCheck.threshold,
    85,
  )
  assert.equal(result.data.problems[0].similarityCheck.threshold, 70)
})

test("older v2 data gains disabled checks with backup, including existing snapshots", () => {
  const { data, assignmentId } = setup()
  const old = apply(data, { type: "status", id: assignmentId, status: "published" }).data
  delete old.specialRules
  delete old.problems[0].similarityCheck
  delete old.problems[0].specialRuleChecks
  delete old.problems[0].specialRuleIds
  delete old.assignmentProblems[0].publishedSnapshot.specialRules
  delete old.assignmentProblems[0].publishedSnapshot.problem.similarityCheck
  delete old.assignmentProblems[0].publishedSnapshot.problem.specialRuleChecks
  delete old.assignmentProblems[0].publishedSnapshot.problem.specialRuleIds
  const original = JSON.stringify(old)
  const values = new Map([[assignmentStorageKey, original]])
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  const upgraded = loadAssignmentData()
  assert.deepEqual(upgraded.problems[0].similarityCheck, { enabled: false, threshold: 80 })
  assert.deepEqual(upgraded.problems[0].specialRuleIds, [])
  assert.deepEqual(upgraded.problems[0].specialRuleChecks, [])
  assert.deepEqual(upgraded.assignmentProblems[0].publishedSnapshot.problem.specialRuleChecks, [])
  assert.deepEqual(upgraded.assignmentProblems[0].publishedSnapshot.specialRules, [])
  assert.equal(values.get(`${assignmentStorageKey}-before-built-in-rules`), original)
  assert.deepEqual(loadAssignmentData(), upgraded)
})

test("catalog provides exactly the requested 12 constructs and validates per-problem choices", () => {
  assert.deepEqual(
    specialRuleCatalog.map((item) => item.label),
    [
      "if 條件判斷",
      "for 迴圈",
      "while 迴圈",
      "函式",
      "巢狀迴圈",
      "遞迴",
      "lambda",
      "list（串列）",
      "dict（字典）",
      "set（集合）",
      "list.sort()",
      "sorted()",
    ],
  )
  assert.equal(
    validateProblem({
      ...problemDraft,
      specialRuleChecks: [
        { feature: "recursion", mode: "required" },
        { feature: "sorted", mode: "forbidden" },
      ],
    }).specialRuleChecks,
    undefined,
  )
  assert.ok(
    validateProblem({
      ...problemDraft,
      specialRuleChecks: [
        { feature: "recursion", mode: "required" },
        { feature: "recursion", mode: "forbidden" },
      ],
    }).specialRuleChecks,
  )
  assert.ok(
    validateProblem({
      ...problemDraft,
      specialRuleChecks: [{ feature: "unknown", mode: "required" }],
    }).specialRuleChecks,
  )
  assert.ok(
    validateProblem({ ...problemDraft, specialRuleChecks: [{ feature: "for", mode: "none" }] })
      .specialRuleChecks,
  )
})

test("built-in rules belong to one problem, copy correctly and remain fixed at publication", () => {
  const { data, problemId, assignmentId } = setup()
  let result = apply(data, {
    type: "save-problem",
    id: problemId,
    draft: {
      ...problemDraft,
      specialRuleChecks: [
        { feature: "for", mode: "required" },
        { feature: "sorted", mode: "forbidden" },
      ],
    },
  })
  result = apply(result.data, { type: "copy-problem", id: problemId })
  const copyId = result.id
  assert.deepEqual(
    result.data.problems.find((item) => item.id === copyId).specialRuleChecks,
    result.data.problems.find((item) => item.id === problemId).specialRuleChecks,
  )
  result = apply(result.data, { type: "status", id: assignmentId, status: "published" })
  result = apply(result.data, {
    type: "save-problem",
    id: problemId,
    draft: { ...problemDraft, specialRuleChecks: [{ feature: "while", mode: "required" }] },
  })
  assert.deepEqual(result.data.assignmentProblems[0].publishedSnapshot.problem.specialRuleChecks, [
    { feature: "for", mode: "required" },
    { feature: "sorted", mode: "forbidden" },
  ])
  assert.deepEqual(
    publicProblemView(result.data.assignmentProblems[0].publishedSnapshot.problem, []).specialRules,
    { required: ["for 迴圈"], forbidden: ["sorted()"] },
  )
  assert.deepEqual(result.data.problems.find((item) => item.id === copyId).specialRuleChecks, [
    { feature: "for", mode: "required" },
    { feature: "sorted", mode: "forbidden" },
  ])
  assert.ok(isAssignmentData(result.data))
})
