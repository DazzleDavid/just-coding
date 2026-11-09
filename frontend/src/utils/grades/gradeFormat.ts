import type { SubmissionView } from "../../types/grade"

export function submissionCountingLabel(view: SubmissionView) {
  if (view.validity) return view.validity
  if (view.counted) return "本題採計"
  if (view.score === null)
    return !view.run || ["Pending", "Judging"].includes(view.run.status)
      ? "有效提交，待評測"
      : "評測結果不適用"
  return "有效，未採計最高分"
}
