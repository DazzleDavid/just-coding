import type { ProblemDraft } from "../../types/problem"

const tabFields = {
  basic: [
    "code",
    "title",
    "difficulty",
    "tags",
    "points",
    "timeLimitMs",
    "memoryLimitMb",
    "allowedLanguages",
    "similarityCheck",
  ],
  statement: ["statementMarkdown"],
  "special-rules": ["specialRuleIds", "specialRuleChecks"],
} as const satisfies Record<string, readonly (keyof ProblemDraft)[]>

export function problemTabPatch(tab: string, draft: ProblemDraft): Partial<ProblemDraft> {
  const fields = tabFields[tab as keyof typeof tabFields] ?? []
  return Object.fromEntries(fields.map((field) => [field, draft[field]]))
}

export function problemTabDirty(tab: string, draft: ProblemDraft, baseline: ProblemDraft) {
  return (
    JSON.stringify(problemTabPatch(tab, draft)) !== JSON.stringify(problemTabPatch(tab, baseline))
  )
}

export function mergeProblemTab(
  tab: string,
  draft: ProblemDraft,
  saved: ProblemDraft,
): ProblemDraft {
  return { ...saved, ...problemTabPatch(tab, draft) }
}
