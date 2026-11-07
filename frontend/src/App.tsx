
import { useEffect, useState } from "react"
import {
  BookOpen,
  CheckCircle2,
  Code2,
  GitBranch,
  Moon,
  Sun,
  Terminal,
} from "lucide-react"

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return localStorage.getItem("just-coding-theme") === "dark"
      ? "dark"
      : "light"
  })

  const [count, setCount] = useState(0)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.style.colorScheme = theme
    localStorage.setItem("just-coding-theme", theme)
  }, [theme])

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#0B1120] dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2 text-white">
              <Code2 size={22} />
            </div>

            <div>
              <h1 className="text-lg font-bold">Just Coding.</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Programming Assignment System
              </p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <CheckCircle2 size={14} />
            Development Environment Ready
          </div>

          <h2 className="mb-3 text-3xl font-bold tracking-tight">
            Welcome to Just Coding.
          </h2>

          <p className="text-slate-500 dark:text-slate-400">
            程式作業繳交與管理平台 — 前端環境測試頁面
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <Code2 size={24} />,
              title: "Frontend",
              description: "React + TypeScript + Vite",
              status: "Ready",
            },
            {
              icon: <Terminal size={24} />,
              title: "Docker",
              description: "Container Development",
              status: "Configured",
            },
            {
              icon: <GitBranch size={24} />,
              title: "GitHub",
              description: "Version Control",
              status: "Connected",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#151E30]"
            >
              <div className="mb-4 text-blue-500">{item.icon}</div>

              <h3 className="mb-1 font-semibold">{item.title}</h3>

              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                {item.description}
              </p>

              <span className="text-xs font-medium text-emerald-500">
                ● {item.status}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#151E30]">
          <div className="mb-5 flex items-center gap-2">
            <BookOpen size={20} className="text-blue-500" />
            <h3 className="text-lg font-semibold">功能測試</h3>
          </div>

          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
            按下按鈕，確認 React 狀態更新與 Tailwind CSS 正常運作。
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCount(count + 1)}
              className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Click Me
            </button>

            <span className="text-sm">
              Count: <strong>{count}</strong>
            </span>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-400">
        Just Coding © 2026
      </footer>
    </div>
  )
}

export default App
