import { useState } from "react"
import { input, outlineButton } from "../ui/styles"

import { MarkdownPreview } from "./MarkdownPreview"

export const statementTemplate = `# 題目名稱

## 題目敘述

請在此輸入題目的背景與要求。

## 輸入說明

請說明輸入格式。

## 輸出說明

請說明輸出格式。

## 限制條件

請說明資料範圍。
`

export function ProblemStatementEditor({
  value,
  onChange,
  readOnly,
  error,
}: {
  value: string
  onChange: (value: string) => void
  readOnly: boolean
  error?: string
}) {
  const [mode, setMode] = useState("edit")
  return (
    <div className="space-y-4">
      <div className="flex gap-2 lg:hidden">
        <button
          type="button"
          className={outlineButton}
          aria-pressed={mode === "edit"}
          onClick={() => setMode("edit")}
        >
          編輯
        </button>
        <button
          type="button"
          className={outlineButton}
          aria-pressed={mode === "preview"}
          onClick={() => setMode("preview")}
        >
          預覽
        </button>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className={mode === "edit" ? "block" : "hidden lg:block"}>
          <label
            htmlFor="problem-markdown"
            className="mb-3 block text-sm font-medium"
          >
            Markdown 原始文字<sup className="ml-1 text-destructive">*</sup>
          </label>
          <textarea
            id="problem-markdown"
            readOnly={readOnly}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? "markdown-error" : undefined}
            spellCheck={false}
            className={`${input} min-h-[540px] resize-y font-mono leading-7`}
          />
          {error && (
            <p
              id="markdown-error"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </div>
        <div className={mode === "preview" ? "block" : "hidden lg:block"}>
          <h3 className="mb-3 text-sm font-medium">說明即時預覽</h3>
          <div className="min-h-[540px]">
            <MarkdownPreview value={value} />
          </div>
        </div>
      </div>
    </div>
  )
}
