import type { AssignmentProblem } from "../../types/assignmentProblem"
import type { JudgeRun } from "../../types/judgeRun"
import type { Student } from "../../lib/students"
import type {
  GradeInput,
  GradeState,
  SubmissionView,
  ProblemGrade,
  StudentAssignmentGrade,
  AssignmentGradeSummary,
  StudentGradeSummary,
} from "../../types/grade"

export function assessmentKey(relation: AssignmentProblem): string | null {
  const snapshot = relation.publishedSnapshot
  if (!snapshot) return null
  // The key identifies the exact frozen assessment, without introducing content version counters.
  return JSON.stringify([relation.id, relation.points, snapshot])
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000
}

export function submissionValidity(
  input: GradeInput,
  view: Omit<SubmissionView, "validity" | "score" | "counted">,
): string | null {
  const { submission, student, assignment, relation } = view
  if (!student || !assignment || !relation || relation.assignmentId !== submission.assignmentId)
    return "關聯資料不存在"
  if (submission.deleted) return "已刪除"
  if (submission.voided) return "已作廢"
  if (!submission.accepted) return "未成功接收"
  if (assignment.status === "draft" || !relation.publishedSnapshot) return "作業尚未發布"
  const policy = input.gradeData.policies.find((item) => item.assignmentId === assignment.id)
  const at = Date.parse(submission.submittedAt)
  if (!Number.isFinite(at) || at > input.now) return "無效提交時間"
  if (at < Date.parse(assignment.startAt)) return "尚未開放時提交"
  if (!policy?.countLate && at > Date.parse(assignment.dueAt)) return "逾期，不列入採計"
  if (!relation.publishedSnapshot.problem.allowedLanguages.includes(submission.language))
    return "不符合題目使用語言"
  return null
}

export function effectiveRunScore(
  run: JudgeRun | undefined,
  relation: AssignmentProblem | undefined,
): number | null {
  if (!run || !relation || !run.valid || run.assessmentKey !== assessmentKey(relation)) return null
  if (
    ["Pending", "Judging", "SE"].includes(run.status) ||
    !run.judgedAt ||
    !Number.isFinite(Date.parse(run.judgedAt))
  )
    return null
  if (
    run.score === null ||
    !Number.isFinite(run.score) ||
    !Number.isFinite(run.maxScore) ||
    run.maxScore <= 0 ||
    run.score < 0 ||
    run.score > run.maxScore
  )
    return null
  if (run.status === "AC" && run.score !== run.maxScore) return null
  return (run.score / run.maxScore) * relation.points
}

export function getBestSubmission(views: SubmissionView[]): SubmissionView | undefined {
  return views
    .filter((item) => item.validity === null && item.score !== null)
    .sort(
      (a, b) =>
        b.score! - a.score! ||
        Date.parse(a.submission.submittedAt) - Date.parse(b.submission.submittedAt) ||
        a.submission.submissionNumber - b.submission.submissionNumber ||
        a.submission.id.localeCompare(b.submission.id),
    )[0]
}

function problemGrade(
  input: GradeInput,
  relation: AssignmentProblem,
  submissions: SubmissionView[],
): ProblemGrade {
  const views = submissions
  const valid = views.filter((item) => item.validity === null)
  const best = getBestSubmission(valid)
  const assignment = input.assignments.find((item) => item.id === relation.assignmentId)!
  const state: GradeState =
    assignment.status === "draft" || !relation.publishedSnapshot
      ? "unavailable"
      : best
        ? "scored"
        : !valid.length
          ? "unsubmitted"
          : valid.some((item) => !item.run || ["Pending", "Judging"].includes(item.run.status))
            ? "pending"
            : "error"
  return {
    relation,
    problem:
      relation.publishedSnapshot?.problem ??
      input.problems.find((item) => item.id === relation.problemId),
    submissions: views,
    submitted: valid.length > 0,
    completed: !!best?.run && best.run.score === best.run.maxScore,
    score: best?.score ?? null,
    best,
    state,
    lastSubmittedAt: valid
      .map((item) => item.submission.submittedAt)
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0],
  }
}

export function getSubmittedProblemCount(problems: ProblemGrade[]) {
  return problems.filter((item) => item.submitted).length
}
export function getCompletedProblemCount(problems: ProblemGrade[]) {
  return problems.filter((item) => item.completed).length
}
export function getSubmissionCount(problems: ProblemGrade[]) {
  return problems.reduce(
    (sum, item) => sum + item.submissions.filter((view) => view.validity === null).length,
    0,
  )
}
export function getAssignmentScore(problems: ProblemGrade[]): {
  score: number | null
  state: GradeState
} {
  if (!problems.length || problems.some((item) => item.state === "unavailable"))
    return { score: null, state: "unavailable" }
  if (!problems.some((item) => item.submitted)) return { score: null, state: "unsubmitted" }
  if (problems.some((item) => item.state === "error")) return { score: null, state: "error" }
  if (problems.some((item) => item.state === "pending")) return { score: null, state: "pending" }
  // Missing questions contribute no points to a submitted assignment; no zero result is stored.
  return {
    score: round(problems.reduce((sum, item) => sum + (item.score ?? 0), 0)),
    state: "scored",
  }
}

export function getStudentGradeSummary(
  student: Student,
  own: StudentAssignmentGrade[],
  now: number,
): StudentGradeSummary {
  const samples = own
    .filter(
      (row) =>
        row.assignment.status === "published" &&
        Date.parse(row.assignment.dueAt) <= now &&
        row.maxScore > 0,
    )
    .flatMap((row) => (row.score !== null ? [row.score / row.maxScore] : []))
  return {
    student,
    assignments: own,
    started: own.filter((row) => row.submitted > 0).length,
    submitted: own.reduce((sum, row) => sum + row.submitted, 0),
    completed: own.reduce((sum, row) => sum + row.completed, 0),
    submissionCount: own.reduce((sum, row) => sum + row.submissionCount, 0),
    averageRate: samples.length
      ? round((samples.reduce((sum, rate) => sum + rate, 0) / samples.length) * 100)
      : null,
    sampleSize: samples.length,
  }
}

export function buildGradeBook(input: GradeInput) {
  const students = new Map(input.students.map((item) => [item.id, item]))
  const assignments = new Map(input.assignments.map((item) => [item.id, item]))
  const relations = new Map(input.assignmentProblems.map((item) => [item.id, item]))
  const runs = new Map(input.gradeData.judgeRuns.map((item) => [item.id, item]))
  const submissions: SubmissionView[] = input.gradeData.submissions.map((submission) => {
    const relation = relations.get(submission.assignmentProblemId)
    const run = submission.currentJudgeRunId ? runs.get(submission.currentJudgeRunId) : undefined
    const view = {
      submission,
      student: students.get(submission.studentId),
      assignment: assignments.get(submission.assignmentId),
      relation,
      problem:
        relation?.publishedSnapshot?.problem ??
        input.problems.find((item) => item.id === relation?.problemId),
      run: run?.submissionId === submission.id ? run : undefined,
    }
    const judgedAt = Date.parse(view.run?.judgedAt ?? "")
    const score =
      judgedAt <= input.now && judgedAt >= Date.parse(submission.submittedAt)
        ? effectiveRunScore(view.run, relation)
        : null
    return { ...view, validity: submissionValidity(input, view), score, counted: false }
  })
  const groups = new Map<string, SubmissionView[]>()
  const groupKey = (studentId: string, assignmentId: string, relationId: string) =>
    JSON.stringify([studentId, assignmentId, relationId])
  submissions.forEach((view) => {
    const key = groupKey(
      view.submission.studentId,
      view.submission.assignmentId,
      view.submission.assignmentProblemId,
    )
    const group = groups.get(key) ?? []
    group.push(view)
    groups.set(key, group)
  })
  const byAssignment: AssignmentGradeSummary[] = input.assignments.map((assignment) => {
    const own = input.assignmentProblems
      .filter((item) => item.assignmentId === assignment.id)
      .sort((a, b) => a.order - b.order)
    const maxScore = round(own.reduce((sum, item) => sum + item.points, 0))
    const rows: StudentAssignmentGrade[] = input.students.map((student) => {
      const problems = own.map((relation) =>
        problemGrade(
          input,
          relation,
          groups.get(groupKey(student.id, assignment.id, relation.id)) ?? [],
        ),
      )
      problems.forEach((problem) => {
        if (problem.best) problem.best.counted = true
      })
      return {
        student,
        assignment,
        problems,
        maxScore,
        submitted: getSubmittedProblemCount(problems),
        completed: getCompletedProblemCount(problems),
        submissionCount: getSubmissionCount(problems),
        ...getAssignmentScore(problems),
        lastSubmittedAt: problems
          .flatMap((item) => (item.lastSubmittedAt ? [item.lastSubmittedAt] : []))
          .sort((a, b) => Date.parse(b) - Date.parse(a))[0],
      }
    })
    const samples = rows.flatMap((row) =>
      row.state === "scored" && row.score !== null && maxScore > 0
        ? [row.score / maxScore]
        : [],
    )
    return {
      assignment,
      rows,
      totalProblems: own.length,
      maxScore,
      submittedStudents: rows.filter((row) => row.submitted > 0).length,
      unsubmittedStudents: rows.filter((row) => row.submitted === 0).length,
      submittedProblems: rows.reduce((sum, row) => sum + row.submitted, 0),
      averageRate: samples.length
        ? round((samples.reduce((sum, value) => sum + value, 0) / samples.length) * 100)
        : null,
      sampleSize: samples.length,
      unresolvedStudents: rows.filter((row) => ["pending", "error"].includes(row.state)).length,
    }
  })
  const byStudent: StudentGradeSummary[] = input.students.map((student) => {
    const own = byAssignment.flatMap((item) =>
      item.rows.filter((row) => row.student.id === student.id),
    )
    return getStudentGradeSummary(student, own, input.now)
  })
  return { assignments: byAssignment, students: byStudent, submissions }
}
