export const languages = ["Python 3", "C", "C++"] as const
export type Language = typeof languages[number]
export type AssignmentStatus = "draft" | "published" | "archived"
export type AssignmentDraft = {
  code: string
  title: string
  description: string
  startAt: string
  dueAt: string
  allowedLanguages: Language[]
}
export type Assignment = AssignmentDraft & {
  id: string
  status: AssignmentStatus
  createdAt: string
  updatedAt: string
}
