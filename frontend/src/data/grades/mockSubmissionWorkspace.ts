import { emptyAssignmentData } from "../../services/shared/managementStorage"
import { applyAssignmentAction } from "../../utils/assignments/assignmentOperations"
import { assessmentKey } from "../../utils/grades/gradeCalculation"
import type { GradeDemoData } from "../../types/grade"
import type { ProblemDraft } from "../../types/problem"
import { createDemoGradeData } from "./mockGradeData"

const day = 24 * 60 * 60 * 1000
const samplePrograms: Record<string, string> = {
  "DEMO-P001": `a, b = map(int, input().split())
print(a + b)
`,
  "DEMO-P002": `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> values(n);
    for (int &value : values) std::cin >> value;
    std::sort(values.begin(), values.end());
    for (int i = 0; i < n; ++i)
        std::cout << (i ? " " : "") << values[i];
    std::cout << "\\n";
}
`,
  "DEMO-P003": `n = int(input())
answer = 1
for number in range(1, n + 1):
    answer *= number
print(answer)
`,
}
const exampleProblems = [
  {
    code: "DEMO-P001",
    title: "兩數相加",
    language: "Python 3" as const,
    statement:
      "## 題目說明\n輸入兩個整數，輸出它們的總和。\n\n### 輸入格式\n兩個以空白分隔的整數。\n\n### 輸出格式\n輸出相加結果。",
    cases: [
      ["1 2", "3"],
      ["-5 5", "0"],
      ["100 200", "300"],
    ],
  },
  {
    code: "DEMO-P002",
    title: "整數排序",
    language: "C++" as const,
    statement:
      "## 題目說明\n將給定整數由小到大排序。\n\n### 輸入格式\n第一行為數量 n，第二行為 n 個整數。\n\n### 輸出格式\n以空白分隔輸出排序結果。",
    cases: [
      ["3\n3 1 2", "1 2 3"],
      ["4\n4 4 -1 0", "-1 0 4 4"],
      ["1\n8", "8"],
    ],
  },
  {
    code: "DEMO-P003",
    title: "階乘計算",
    language: "Python 3" as const,
    statement:
      "## 題目說明\n計算非負整數 n 的階乘。\n\n### 輸入格式\n一個整數 n，0 ≤ n ≤ 12。\n\n### 輸出格式\n輸出 n!。",
    cases: [
      ["5", "120"],
      ["0", "1"],
      ["10", "3628800"],
    ],
  },
]

export function createSubmissionDemoWorkspace(now = Date.now()): GradeDemoData {
  let management = emptyAssignmentData()
  const problemIds: string[] = []
  exampleProblems.forEach((example) => {
    const draft: ProblemDraft = {
      code: example.code,
      title: example.title,
      statementMarkdown: example.statement,
      difficulty: "easy",
      tags: ["測試資料"],
      points: 100,
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      outputComparisonMode: "trim-line-end",
      allowedLanguages: [example.language],
      similarityCheck: { enabled: false, threshold: 80 },
      specialRuleIds: [],
      specialRuleChecks: [],
    }
    const saved = applyAssignmentAction(management, { type: "save-problem", draft })
    management = saved.data
    problemIds.push(saved.id)
    example.cases.forEach(([input, expectedOutput], index) => {
      management = applyAssignmentAction(management, {
        type: "save-testcase",
        problemId: saved.id,
        draft: {
          name: `測資 ${index + 1}`,
          input,
          expectedOutput,
          visibility: index === 0 ? "public" : "hidden",
          enabled: true,
        },
      }).data
    })
  })
  const assignmentWindows = [
    { code: "DEMO-HW01", title: "基礎程式設計", start: -10, due: -1 },
    { code: "DEMO-HW02", title: "迴圈與排序練習", start: -2, due: 5 },
    { code: "DEMO-HW03", title: "下週練習", start: 2, due: 9 },
  ]
  assignmentWindows.forEach((window) => {
    const saved = applyAssignmentAction(management, {
      type: "save-assignment",
      draft: {
        code: window.code,
        title: window.title,
        description: "供繳交紀錄與查看成績操作使用的虛構作業。",
        startAt: new Date(now + window.start * day).toISOString(),
        dueAt: new Date(now + window.due * day).toISOString(),
      },
      problemConfiguration: problemIds.map((problemId, index) => ({
        problemId,
        points: [40, 30, 30][index],
      })),
    })
    management = applyAssignmentAction(saved.data, {
      type: "status",
      id: saved.id,
      status: "published",
    }).data
  })
  const createdAt = new Date(now - 20 * day).toISOString()
  management.problems.forEach((problem) => {
    problem.createdAt = createdAt
    problem.updatedAt = createdAt
  })
  management.assignments.forEach((assignment) => {
    assignment.createdAt = new Date(now - 15 * day).toISOString()
    assignment.updatedAt = new Date(
      Math.min(now, Date.parse(assignment.startAt) - 3600000),
    ).toISOString()
  })
  management.assignmentProblems.forEach((relation) => {
    const snapshot = relation.publishedSnapshot!
    snapshot.capturedAt = management.assignments.find(
      (assignment) => assignment.id === relation.assignmentId,
    )!.updatedAt
    snapshot.problem.createdAt = createdAt
    snapshot.problem.updatedAt = createdAt
  })
  const names = [
    "王小明",
    "陳小華",
    "林小美",
    "張同學",
    "李佳穎",
    "黃柏宇",
    "蔡宜庭",
    "吳承恩",
    "Alex Chen",
    "Emma Lin",
    "許家豪",
    "周品妤",
    "鄭子軒",
    "楊思涵",
    "劉冠廷",
    "何雅雯",
    "郭育誠",
    "曾詩晴",
    "謝宇翔",
    "洪筱涵",
    "邱彥廷",
    "廖心妤",
    "徐睿哲",
    "蘇宥安",
  ]
  const students = names.map((name, index) => ({
    id: `demo-student-${String(index + 1).padStart(2, "0")}`,
    studentNumber: `00115598${String(index + 1).padStart(3, "0")}`,
    name,
    className: ["資工一甲", "資工一乙", "資管一甲"][Math.floor(index / 8)],
    active: index !== 23,
    email: `demo${index + 1}@example.test`,
    notes: "虛構測試學生",
    createdAt: new Date(now - 20 * day).toISOString(),
    updatedAt: new Date(now - 20 * day).toISOString(),
  }))
  const grades = createDemoGradeData({
    ...management,
    students,
    now,
    gradeData: {
      version: 1,
      submissions: [],
      judgeRuns: [],
      policies: [],
    },
  })

  const firstAssignment = management.assignments[0]
  const firstRelations = management.assignmentProblems
    .filter((relation) => relation.assignmentId === firstAssignment.id)
    .sort((a, b) => a.order - b.order)
  const fullStudent = students[8]
  // A fully completed student complements the 16 / 32 / 24 best-score example for student 1.
  firstRelations.forEach((relation, index) => {
    const source = grades.submissions.find(
      (submission) =>
        submission.studentId === fullStudent.id && submission.assignmentProblemId === relation.id,
    )!
    const id = `demo-full-${index}`
    const runId = `${id}-run`
    const submittedAt = new Date(now - 2 * day + index * 60000).toISOString()
    grades.submissions.push({
      ...source,
      id,
      submittedAt,
      submissionNumber:
        grades.submissions.filter(
          (submission) =>
            submission.studentId === fullStudent.id &&
            submission.assignmentProblemId === relation.id,
        ).length + 1,
      currentJudgeRunId: runId,
    })
    grades.judgeRuns.push({
      id: runId,
      submissionId: id,
      status: "AC",
      score: 100,
      maxScore: 100,
      judgedAt: submittedAt,
      assessmentKey: assessmentKey(relation)!,
      valid: true,
      testCaseResults: relation
        .publishedSnapshot!.testCases.filter((testCase) => testCase.enabled)
        .map((testCase) => ({
          testCaseId: testCase.id,
          verdict: "AC",
          earnedScore: 100 / 3,
          executionTimeMs: 18,
          memoryUsedKb: 2048,
        })),
    })
  })
  const original = grades.submissions[0]
  const originalRun = grades.judgeRuns.find((run) => run.id === original.currentJudgeRunId)!
  grades.judgeRuns.push({
    ...structuredClone(originalRun),
    id: `${originalRun.id}-history`,
    status: "WA",
    score: 0,
    valid: false,
    testCaseResults: originalRun.testCaseResults.map((result) => ({
      ...result,
      verdict: "WA",
      earnedScore: 0,
    })),
  })
  grades.submissions.push({
    ...original,
    id: "demo-late",
    submittedAt: new Date(now - day / 2).toISOString(),
    submissionNumber: 4,
    currentJudgeRunId: null,
  })
  grades.submissions.push({
    ...original,
    id: "demo-voided",
    voided: true,
    submissionNumber: 5,
    currentJudgeRunId: null,
  })
  grades.submissions.forEach((submission) => {
    const relation = management.assignmentProblems.find(
      (item) => item.id === submission.assignmentProblemId,
    )!
    const code = relation.publishedSnapshot!.problem.code
    const run = grades.judgeRuns.find((item) => item.id === submission.currentJudgeRunId)
    const python = submission.language === "Python 3"
    if (run?.status === "CE")
      submission.sourceCode = python
        ? "# Syntax error example\nprint(\n"
        : "// Compilation error example\nint main() { return 0 }\n"
    else if (run?.status === "TLE")
      submission.sourceCode = python
        ? "# Time limit example\nwhile True:\n    pass\n"
        : "// Time limit example\nint main() { while (true) {} }\n"
    else if (run?.status === "RE")
      submission.sourceCode = python
        ? "# Runtime error example\nprint(1 // 0)\n"
        : '#include <stdexcept>\nint main() { throw std::runtime_error("demo"); }\n'
    else submission.sourceCode = samplePrograms[code]
  })
  return { ...grades, workspace: { management, students } }
}
