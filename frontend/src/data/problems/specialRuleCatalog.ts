import type { SpecialRuleFeature } from "../../types/specialRule"

export const specialRuleCatalog: { feature: SpecialRuleFeature; label: string }[] = [
  { feature: "if", label: "if 條件判斷" },
  { feature: "for", label: "for 迴圈" },
  { feature: "while", label: "while 迴圈" },
  { feature: "function", label: "函式" },
  { feature: "nested-loops", label: "巢狀迴圈" },
  { feature: "recursion", label: "遞迴" },
  { feature: "lambda", label: "lambda" },
  { feature: "list", label: "list（串列）" },
  { feature: "dict", label: "dict（字典）" },
  { feature: "set", label: "set（集合）" },
  { feature: "list-sort", label: "list.sort()" },
  { feature: "sorted", label: "sorted()" },
]
