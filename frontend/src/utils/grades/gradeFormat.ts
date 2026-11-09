import type { GradeState, SubmissionView } from "../../types/grade"

export function gradeText(score: number | null, state: GradeState) {
  if (score !== null) return Number(score.toFixed(2)).toString()
  return {
    unsubmitted: "未繳交",
    pending: "待評測",
    error: "評測異常",
    unavailable: "不計分",
    scored: "—",
  }[state]
}

export const rateText = (rate: number | null) => (rate === null ? "—" : `${rate.toFixed(1)}%`)

export function submissionCountingLabel(view: SubmissionView) {
  if (view.validity) return view.validity
  if (view.counted) return "本題採計"
  if (view.score === null)
    return !view.run || ["Pending", "Judging"].includes(view.run.status)
      ? "有效提交，待評測"
      : "評測結果不適用"
  return "有效，未採計最高分"
}
