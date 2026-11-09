import type { AssignmentProblem } from "../../types/assignmentProblem"
import type { JudgeRun } from "../../types/judgeRun"
import type { GradeInput, SubmissionView } from "../../types/grade"

export function assessmentKey(relation: AssignmentProblem): string | null {
  const snapshot = relation.publishedSnapshot
  if (!snapshot) return null
  // The key identifies the exact frozen assessment, without introducing content version counters.
  return JSON.stringify([relation.id, relation.points, snapshot])
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
  for (const view of submissions) {
    const key = JSON.stringify([
      view.submission.studentId,
      view.submission.assignmentId,
      view.submission.assignmentProblemId,
    ])
    const group = groups.get(key) ?? []
    group.push(view)
    groups.set(key, group)
  }
  for (const group of groups.values()) {
    const best = getBestSubmission(group)
    if (best) best.counted = true
  }
  return { submissions }
}
