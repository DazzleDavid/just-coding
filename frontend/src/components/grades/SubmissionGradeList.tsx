import { useGradeFilters } from "../../hooks/grades/useGradeFilters"
import { useGrades } from "../../hooks/grades/useGrades"
import { judgeStatuses } from "../../types/judgeRun"
import { languages } from "../../types/assignment"
import { GradeSelect, GradeDateFilter } from "./GradeUI"
import { SubmissionGradeTable } from "./SubmissionGradeTable"
import { input, outlineButton } from "../ui/styles"
import { problemLabel } from "../../utils/assignments/gradingUtils"

export function SubmissionGradeList() {
  const filters = useGradeFilters()
  const { book, input: source } = useGrades()
  const rows = book.submissions
    .filter((row) => {
      const submission = row.submission
      const at = Date.parse(submission.submittedAt)
      return (
        !submission.deleted &&
        `${submission.id} ${row.student?.studentNumber ?? ""} ${row.student?.name ?? ""}`
          .toLowerCase()
          .includes(filters.value("q").trim().toLowerCase()) &&
        (!filters.value("student") || submission.studentId === filters.value("student")) &&
        (!filters.value("assignment") || submission.assignmentId === filters.value("assignment")) &&
        (!filters.value("problem") ||
          submission.assignmentProblemId === filters.value("problem")) &&
        (!filters.value("status") || (row.run?.status ?? "Pending") === filters.value("status")) &&
        (!filters.value("language") || submission.language === filters.value("language")) &&
        (!filters.value("counted") ||
          (filters.value("counted") === "yes" ? row.counted : !row.counted)) &&
        (!filters.value("from") || at >= new Date(`${filters.value("from")}T00:00:00`).getTime()) &&
        (!filters.value("to") || at <= new Date(`${filters.value("to")}T23:59:59.999`).getTime())
      )
    })
    .sort((a, b) => Date.parse(b.submission.submittedAt) - Date.parse(a.submission.submittedAt))
  const relations = source.assignmentProblems.filter(
    (item) => !filters.value("assignment") || item.assignmentId === filters.value("assignment"),
  )
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-end gap-3 p-5">
        <input
          className={`${input} flex-[2] basis-52`}
          aria-label="搜尋提交成績"
          placeholder="搜尋學號、姓名或 Submission ID"
          value={filters.value("q")}
          onChange={(event) => filters.update({ q: event.target.value })}
        />
        <GradeSelect
          label="學生"
          value={filters.value("student")}
          onChange={(value) => filters.update({ student: value })}
        >
          <option value="">全部學生</option>
          {source.students.map((student) => (
            <option
              key={student.id}
              value={student.id}
            >
              {student.studentNumber} · {student.name}
            </option>
          ))}
        </GradeSelect>
        <GradeSelect
          label="作業"
          value={filters.value("assignment")}
          onChange={(value) => filters.update({ assignment: value, problem: "" })}
        >
          <option value="">全部作業</option>
          {source.assignments.map((assignment) => (
            <option
              key={assignment.id}
              value={assignment.id}
            >
              {assignment.code} · {assignment.title}
            </option>
          ))}
        </GradeSelect>
        <GradeSelect
          label="作業題目"
          value={filters.value("problem")}
          onChange={(value) => filters.update({ problem: value })}
        >
          <option value="">全部題目</option>
          {relations.map((relation) => (
            <option
              key={relation.id}
              value={relation.id}
            >
              {source.assignments.find((item) => item.id === relation.assignmentId)?.code} ·{" "}
              {problemLabel(relation.order)} ·{" "}
              {relation.publishedSnapshot?.problem.title ??
                source.problems.find((item) => item.id === relation.problemId)?.title}
            </option>
          ))}
        </GradeSelect>
        <GradeSelect
          label="評測狀態"
          value={filters.value("status")}
          onChange={(value) => filters.update({ status: value })}
        >
          <option value="">全部狀態</option>
          {judgeStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </GradeSelect>
        <GradeSelect
          label="語言"
          value={filters.value("language")}
          onChange={(value) => filters.update({ language: value })}
        >
          <option value="">全部語言</option>
          {languages.map((language) => (
            <option key={language}>{language}</option>
          ))}
        </GradeSelect>
        <GradeSelect
          label="採計狀態"
          value={filters.value("counted")}
          onChange={(value) => filters.update({ counted: value })}
        >
          <option value="">全部</option>
          <option value="yes">本題採計提交</option>
          <option value="no">未採計</option>
        </GradeSelect>
        <GradeDateFilter
          label="提交起日"
          value={filters.value("from")}
          onChange={(value) => filters.update({ from: value })}
        />
        <GradeDateFilter
          label="提交迄日"
          value={filters.value("to")}
          onChange={(value) => filters.update({ to: value })}
        />
        <button
          type="button"
          className={outlineButton}
          onClick={filters.reset}
        >
          清除篩選
        </button>
      </div>
      <SubmissionGradeTable rows={rows} />
    </section>
  )
}
