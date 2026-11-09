import { useState } from "react"
import { Link, useParams } from "react-router"
import { ArrowLeft, Pencil } from "lucide-react"
import { useStudents } from "../components/students/StudentStore"
import {
  dangerButton,
  successButton,
  secondaryButton,
  StatusDialog,
  StudentFormDialog,
  StudentStatusBadge,
} from "../components/students/StudentUI"

export function StudentDetail() {
  const { id } = useParams()
  const { students } = useStudents()
  const student = students.find((item) => item.id === id)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  if (!student)
    return (
      <div className="space-y-4 p-8">
        <h1 className="text-2xl font-bold">找不到學生</h1>
        <p className="text-muted-foreground">這筆學生資料不存在，請返回列表重新選擇。</p>
        <Link
          to="/students"
          className={secondaryButton}
        >
          <ArrowLeft size={17} />
          返回學生列表
        </Link>
      </div>
    )
  const formatDate = (value: string) =>
    new Date(value).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
  return (
    <div className="space-y-6 p-6 sm:p-8">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">學生基本資料</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/students"
              className={secondaryButton}
            >
              <ArrowLeft size={17} />
              返回學生列表
            </Link>
            <button
              className={secondaryButton}
              onClick={() => setEditing(true)}
            >
              <Pencil size={16} />
              編輯資料
            </button>
          </div>
        </div>
        <dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["學號", student.studentNumber],
            ["姓名", student.name],
            ["Email", student.email],
            ["班級", student.className || "—"],
            ["建立時間", formatDate(student.createdAt)],
            ["最後更新時間", formatDate(student.updatedAt)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="mb-2 text-sm text-muted-foreground">
                {label}
                {["學號", "姓名"].includes(label) && (
                  <sup
                    aria-label="必填"
                    className="ml-1 text-destructive"
                  >
                    *
                  </sup>
                )}
              </dt>
              <dd className="text-sm break-words">{value}</dd>
            </div>
          ))}
          <div>
            <dt className="mb-2 text-sm text-muted-foreground">帳號狀態</dt>
            <dd>
              <StudentStatusBadge active={student.active} />
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="mb-2 text-sm text-muted-foreground">備註</dt>
            <dd className="text-sm whitespace-pre-wrap break-words">
              {student.notes || "尚無備註"}
            </dd>
          </div>
        </dl>
      </section>
      <section className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-border bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold">帳號管理</h2>
          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            目前狀態
            <StudentStatusBadge active={student.active} />
          </div>
        </div>
        <button
          className={student.active ? dangerButton : successButton}
          onClick={() => setConfirming(true)}
        >
          {student.active ? "停用帳號" : "啟用帳號"}
        </button>
      </section>
      <section className="rounded-xl border border-dashed border-border p-6">
        <h2 className="font-semibold">作業繳交紀錄</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          後續串接課程作業 API 後，將在此顯示繳交紀錄。
        </p>
      </section>
      {editing && (
        <StudentFormDialog
          student={student}
          onClose={() => setEditing(false)}
        />
      )}
      {confirming && (
        <StatusDialog
          student={student}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
