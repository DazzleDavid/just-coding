import { lazy, Suspense } from "react"

const Markdown = lazy(() => import("react-markdown"))

export function MarkdownPreview({ value }: { value: string }) {
  return <article className="overflow-x-auto rounded-lg border border-border bg-background p-5 text-sm leading-7 break-words [&_h1]:mb-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:font-semibold [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_code]:font-mono [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_a]:text-primary [&_a]:underline">
    <Suspense fallback={<p role="status">載入預覽中…</p>}>
      <Markdown skipHtml components={{ img: () => <span className="text-muted-foreground">[圖片預覽已停用]</span> }}>{value || "尚無題目敘述。"}</Markdown>
    </Suspense>
  </article>
}
