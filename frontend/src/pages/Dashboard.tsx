
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  FileCode2,
  Users,
  type LucideIcon,
} from "lucide-react"

type Stat = {
  title: string
  value: string
  icon: LucideIcon
  color: string
}

const stats: Stat[] = [
  {
    title: "作業總數",
    value: "12",
    icon: BookOpen,
    color: "text-blue-500",
  },
  {
    title: "學生人數",
    value: "120",
    icon: Users,
    color: "text-violet-500",
  },
  {
    title: "已繳交",
    value: "96",
    icon: CheckCircle2,
    color: "text-emerald-500",
  },
  {
    title: "待批改",
    value: "8",
    icon: Clock3,
    color: "text-amber-500",
  },
]

const assignments = [
  {
    id: 1,
    name: "HW01 基礎輸入輸出",
    deadline: "2026/11/12",
    submitted: 108,
    total: 120,
    status: "進行中",
  },
  {
    id: 2,
    name: "HW02 條件判斷與迴圈",
    deadline: "2026/11/08",
    submitted: 96,
    total: 120,
    status: "即將截止",
  },
  {
    id: 3,
    name: "HW03 串列與函式",
    deadline: "2026/11/20",
    submitted: 45,
    total: 120,
    status: "進行中",
  },
]

export function Dashboard() {
  return (
    <div className="w-full space-y-8 px-6 py-6 sm:px-8 sm:py-8">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-widest text-blue-500">
          COURSE OVERVIEW
        </p>

        <h1 className="text-2xl font-bold tracking-tight">
          儀表板
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          歡迎回到 Just Coding，這裡可以查看課程作業與學生繳交概況。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent/40"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {item.title}
                </p>

                <Icon size={21} className={item.color} />
              </div>

              <p className="text-3xl font-bold tabular-nums">
                {item.value}
              </p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">
        <section className="min-w-0 rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-2">
            <FileCode2 size={20} className="text-blue-500" />

            <h2 className="font-semibold">
              近期作業
            </h2>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-4 pr-4 font-medium">
                    作業名稱
                  </th>
                  <th className="pb-4 pr-4 font-medium">
                    截止日期
                  </th>
                  <th className="pb-4 pr-4 font-medium">
                    繳交人數
                  </th>
                  <th className="pb-4 font-medium">
                    狀態
                  </th>
                </tr>
              </thead>

              <tbody>
                {assignments.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-accent/40"
                  >
                    <td className="py-4 pr-4 font-medium">
                      {item.name}
                    </td>

                    <td className="py-4 pr-4 text-muted-foreground">
                      {item.deadline}
                    </td>

                    <td className="py-4 pr-4">
                      {item.submitted} / {item.total}
                    </td>

                    <td className="py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                          item.status === "即將截止"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-6 font-semibold">
            系統資訊
          </h2>

          <div className="space-y-5 text-sm">
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">
                系統名稱
              </span>
              <span className="text-right font-medium">
                Just Coding
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">
                目前版本
              </span>
              <span className="text-right font-medium">
                v0.2.0
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">
                開發環境
              </span>
              <span className="text-right font-medium">
                React + Docker
              </span>
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-blue-500/10 p-4 text-sm leading-relaxed text-blue-700 dark:text-blue-300">
            目前使用模擬資料，後續將串接作業、學生與繳交紀錄 API。
          </div>
        </section>
      </div>
    </div>
  )
}
