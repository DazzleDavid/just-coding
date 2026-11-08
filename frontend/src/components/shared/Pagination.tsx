import { input, outlineButton } from "../ui/styles"

export function Pagination({
  total,
  page,
  size,
  onPage,
  onSize,
}: {
  total: number
  page: number
  size: number
  onPage: (page: number) => void
  onSize: (size: number) => void
}) {
  const count = Math.max(1, Math.ceil(total / (size || Math.max(total, 1))))
  const current = Math.min(page, count)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
      <span className="text-muted-foreground">
        共 {total} 筆 · 第 {current} / {count} 頁
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          每頁
          <select
            className={`${input} w-auto!`}
            value={size}
            onChange={(event) => onSize(Number(event.target.value))}
          >
            {[10, 25, 50, 100].map((value) => (
              <option
                value={value}
                key={value}
              >
                {value} 筆
              </option>
            ))}
            <option value={0}>全部</option>
          </select>
        </label>
        <button
          type="button"
          className={outlineButton}
          disabled={current <= 1}
          onClick={() => onPage(current - 1)}
        >
          上一頁
        </button>
        <button
          type="button"
          className={outlineButton}
          disabled={current >= count}
          onClick={() => onPage(current + 1)}
        >
          下一頁
        </button>
      </div>
    </div>
  )
}
