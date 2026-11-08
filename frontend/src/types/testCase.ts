export type TestCaseDraft = {
  name: string
  input: string
  expectedOutput: string
  visibility: "public" | "hidden"
  enabled: boolean
}
export type TestCase = TestCaseDraft & {
  id: string
  problemId: string
  order: number
}
