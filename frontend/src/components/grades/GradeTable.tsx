import type { ReactNode } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { useGradeFilters } from "../../hooks/grades/useGradeFilters"
import { Pagination } from "../shared/Pagination"
import { EmptyState } from "../shared/EmptyState"
import { tableCell } from "../ui/styles"

export type GradeColumn<T> = {
  key: string
  label: string
  width: number
  render: (row: T, index: number) => ReactNode
  sortValue?: (row: T) => string | number
}

export function GradeTable<T>({
  rows,
  columns,
  rowKey,
  empty = "沒有符合條件的資料",
}: {
  rows: T[]
  columns: GradeColumn<T>[]
  rowKey: (row: T) => string
  empty?: string
}) {
  const filters = useGradeFilters()
  const sorting = filters.value("sort")
  const column = columns.find((item) => item.key === sorting.replace(/^-/, ""))
  const sorted = column?.sortValue
    ? [...rows].sort((a, b) => {
        const left = column.sortValue!(a),
          right = column.sortValue!(b)
        const comparison =
          typeof left === "number" && typeof right === "number"
            ? left - right
            : String(left).localeCompare(String(right), "zh-Hant", { numeric: true })
        return sorting.startsWith("-") ? -comparison : comparison
      })
    : rows
  const requestedSize = Number(filters.value("size", "10"))
  const size = [0, 10, 25, 50, 100].includes(requestedSize) ? requestedSize : 10
  const pageSize = size || Math.max(1, sorted.length)
  const requestedPage = Number(filters.value("page", "1"))
  const page = Math.max(
    1,
    Math.min(
      Number.isSafeInteger(requestedPage) ? requestedPage : 1,
      Math.max(1, Math.ceil(sorted.length / pageSize)),
    ),
  )
  const offset = (page - 1) * pageSize
  return (
    <>
      <div className="overflow-x-auto">
        <table
          className="w-full table-fixed border-collapse"
          style={{ minWidth: columns.reduce((sum, item) => sum + item.width, 0) }}
        >
          <colgroup>
            {columns.map((item) => (
              <col
                key={item.key}
                style={{ width: item.width }}
              />
            ))}
          </colgroup>
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {columns.map((item) => {
                const active = column?.key === item.key
                const Icon = active ? (sorting.startsWith("-") ? ArrowDown : ArrowUp) : ArrowUpDown
                return (
                  <th
                    key={item.key}
                    scope="col"
                    className={`${tableCell} font-medium`}
                    aria-sort={
                      active ? (sorting.startsWith("-") ? "descending" : "ascending") : undefined
                    }
                  >
                    {item.sortValue ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        onClick={() =>
                          filters.update({
                            sort:
                              sorting === item.key
                                ? `-${item.key}`
                                : sorting === `-${item.key}`
                                  ? ""
                                  : item.key,
                          })
                        }
                      >
                        {item.label}
                        <Icon size={14} />
                      </button>
                    ) : (
                      item.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(offset, offset + pageSize).map((row, index) => (
              <tr
                key={rowKey(row)}
                className="border-t border-border hover:bg-accent/20"
              >
                {columns.map((column) => (
                  <td
                    className={tableCell}
                    key={column.key}
                  >
                    {column.render(row, offset + index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <EmptyState
          title={empty}
          description="請確認資料或調整搜尋與篩選條件。"
        />
      )}
      <Pagination
        total={rows.length}
        page={page}
        size={size}
        onPage={(value) => filters.update({ page: String(value) }, false)}
        onSize={(value) => filters.update({ size: String(value) })}
      />
    </>
  )
}
