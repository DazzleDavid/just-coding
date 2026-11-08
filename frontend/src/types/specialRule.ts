import type { Language } from "./assignment"

export type SpecialRuleFeature = "if" | "for" | "while" | "function" | "nested-loops" | "recursion" | "lambda" | "list" | "dict" | "set" | "list-sort" | "sorted"
export type SpecialRuleCheck = { feature: SpecialRuleFeature; mode: "required" | "forbidden" }

export type SpecialRuleDraft = {
  name: string
  kind: "required" | "forbidden"
  content: string
  language: Language | "all"
  caseSensitive: boolean
  enabled: boolean
}
export type SpecialRule = SpecialRuleDraft & {
  id: string
  createdAt: string
  updatedAt: string
}
