import type { GradeData, GradeInput } from "../../types/grade"
import type { JudgeStatus } from "../../types/judgeRun"
import { assessmentKey } from "../../utils/grades/gradeCalculation"

// Explicitly enabled demonstration records reference existing entities and never replace live data.
export function createDemoGradeData(input: GradeInput): GradeData {
  const data: GradeData = {
    version: 1,
    policies: structuredClone(input.gradeData.policies),
    submissions: [],
    judgeRuns: [],
  }
  input.assignments
    .filter((assignment) => assignment.status !== "draft")
    .forEach((assignment) => {
      const simulationStudents = input.students.slice(0, 40)
      const relations = input.assignmentProblems
        .filter((item) => item.assignmentId === assignment.id && item.publishedSnapshot)
        .sort((a, b) => a.order - b.order)
      const start = Date.parse(assignment.startAt)
      const end = Math.min(Date.parse(assignment.dueAt), input.now)
      if (end <= start) return
      simulationStudents.forEach(({ id: studentId }, studentIndex) => {
        if (studentIndex % 4 === 3) return
        relations.forEach((relation, problemIndex) => {
          if (
            (studentIndex % 4 === 1 && problemIndex === relations.length - 1) ||
            (studentIndex % 4 === 2 && problemIndex > 0)
          )
            return
          const attempts = studentIndex % 4 === 0 && problemIndex === 0 ? 3 : 1
          for (let attempt = 0; attempt < attempts; attempt++) {
            const id = `demo-${assignment.id}-${relation.id}-${studentId}-${attempt}`
            const statuses: JudgeStatus[] = [
              "AC",
              "Partial",
              "WA",
              "Pending",
              "CE",
              "TLE",
              "Judging",
              "SE",
              "MLE",
              "RE",
            ]
            const status =
              attempts === 3 ? "Partial" : statuses[(studentIndex + problemIndex) % statuses.length]
            const score =
              attempts === 3
                ? [40, 80, 60][attempt]
                : status === "AC"
                  ? 100
                  : status === "Partial"
                    ? 60
                    : ["Pending", "Judging", "SE"].includes(status)
                      ? null
                      : 0
            const submittedAt = new Date(
              start + (end - start) * (0.1 + (attempt + 1) * 0.1),
            ).toISOString()
            const runId = `${id}-run`
            const language = relation.publishedSnapshot!.problem.allowedLanguages[0]
            data.submissions.push({
              id,
              studentId,
              assignmentId: assignment.id,
              assignmentProblemId: relation.id,
              language,
              sourceCode:
                language === "Python 3"
                  ? "# Demonstration submission\na, b = map(int, input().split())\nprint(a + b)\n"
                  : "// Demonstration submission\nint main() { return 0; }\n",
              submittedAt,
              submissionNumber: attempt + 1,
              accepted: true,
              voided: false,
              deleted: false,
              currentJudgeRunId: runId,
            })
            const cases = relation.publishedSnapshot!.testCases.filter((item) => item.enabled)
            data.judgeRuns.push({
              id: runId,
              submissionId: id,
              status,
              score,
              maxScore: 100,
              judgedAt: score === null ? null : submittedAt,
              assessmentKey: assessmentKey(relation)!,
              valid: true,
              testCaseResults:
                score === null
                  ? []
                  : cases.map((item, index) => {
                      const fraction = Math.max(
                        0,
                        Math.min(1, (cases.length * score) / 100 - index),
                      )
                      return {
                        testCaseId: item.id,
                        verdict:
                          fraction === 1
                            ? "AC"
                            : fraction > 0
                              ? "Partial"
                              : status === "Partial"
                                ? "WA"
                                : status,
                        earnedScore: (fraction * 100) / Math.max(cases.length, 1),
                        executionTimeMs: 12 + index,
                        memoryUsedKb: 2048,
                      }
                    }),
            })
          }
        })
      })
    })
  if (!data.submissions.length)
    throw new Error("請先建立學生及已開放、已發布且含有題目的作業，再載入示範資料。")
  return data
}
