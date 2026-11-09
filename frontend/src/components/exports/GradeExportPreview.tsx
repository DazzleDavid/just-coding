import { useState } from "react"
import type { GradeExportReport } from "../../types/exports"
import { Pagination } from "../shared/Pagination"
import { tableCell } from "../ui/styles"

export function GradeExportPreview({
  report,
  error,
  roster,
}: {
  report: GradeExportReport | null
  error: string
  roster: boolean
}) {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const perPage = size || Math.max(report?.rows.length ?? 0, 1)
  const currentPage = Math.max(
    1,
    Math.min(page, Math.max(1, Math.ceil((report?.rows.length ?? 0) / perPage))),
  )
  const offset = (currentPage - 1) * perPage
  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap justify-between gap-2 p-4 text-sm">
        <h3 className="font-medium">匯出預覽</h3>
        {report && (
          <span className="text-xs text-muted-foreground">
            共 {report.rows.length} 列
            {roster
              ? ` · 比對成功 ${report.matched} 列 · 未比對 ${report.unmatched} 列`
              : " · 依學號排序"}
          </span>
        )}
      </div>
      {report ? (
        <>
          <div className="overflow-x-auto">
            <table
              className="w-full table-fixed"
              style={{ minWidth: Math.max(640, (report.headers.length + (roster ? 2 : 1)) * 150) }}
            >
              <thead className="bg-muted/50">
                <tr>
                  <th
                    scope="col"
                    className={tableCell}
                  >
                    {roster ? "原 Excel 列" : "序號"}
                  </th>
                  {report.headers.map((header, index) => (
                    <th
                      key={index}
                      scope="col"
                      className={tableCell}
                    >
                      {header}
                    </th>
                  ))}
                  {roster && (
                    <th
                      scope="col"
                      className={tableCell}
                    >
                      比對狀態（僅預覽）
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {report.rows.slice(offset, offset + perPage).map((row, index) => (
                  <tr
                    key={offset + index}
                    className="border-t border-border"
                  >
                    <td className={tableCell}>
                      {roster ? report.preview[offset + index].row : offset + index + 1}
                    </td>
                    {row.map((value, column) => (
                      <td
                        key={column}
                        className={tableCell}
                      >
                        {String(value)}
                      </td>
                    ))}
                    {roster && (
                      <td
                        className={`${tableCell} ${report.preview[offset + index].matched ? "text-muted-foreground" : "text-destructive"}`}
                      >
                        {report.preview[offset + index].result}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            total={report.rows.length}
            page={currentPage}
            size={size}
            onPage={setPage}
            onSize={(value) => {
              setSize(value)
              setPage(1)
            }}
          />
        </>
      ) : (
        <p className="px-4 pb-4 text-sm text-muted-foreground">{error}</p>
      )}
    </section>
  )
}
