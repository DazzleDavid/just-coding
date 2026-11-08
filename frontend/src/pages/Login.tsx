import { useState, type FormEvent } from "react"
import { ArrowRight, Code2, Eye, EyeOff, Moon, Sun } from "lucide-react"
import { Link } from "react-router"

type LoginProps = {
  theme: "light" | "dark"
  onToggleTheme: () => void
  onLogin: (course: string) => void
}

export function Login({ theme, onToggleTheme, onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const course = data.get("course")
    if (typeof course !== "string" || !course) {
      setNotice("請先選擇課程。 Please select a course.")
      return
    }
    if (data.get("username") === "demo" && data.get("password") === "demo1234") {
      setNotice("")
      onLogin(course)
      return
    }
    setNotice("帳號或密碼錯誤。 Incorrect username or password.")
  }

  const inputClass = "h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"

  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-hidden bg-background text-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px]" />
      <header className="flex min-h-[88px] items-center justify-between gap-4 px-6 sm:px-10">
        <Link to="/" aria-label="Just Coding 首頁 / Home" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Code2 size={22} /></span>
          <span className="text-lg font-bold tracking-tight">Just Coding.</span>
        </Link>
        <button type="button" onClick={onToggleTheme} aria-label={theme === "dark" ? "切換淺色主題 / Switch to light mode" : "切換深色主題 / Switch to dark mode"} className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </header>

      <main className="grid flex-1 items-center gap-10 px-6 py-10 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-20">
        <section aria-labelledby="welcome-title" className="w-full lg:py-8">
          <p className="mb-4 inline-flex rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-primary">Hello, world. Hello, you.</p>
          <h1 id="welcome-title" className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl xl:text-5xl">每一行程式，<br />都是新的開始。</h1>
          <p lang="en" className="mt-4 text-lg font-medium text-primary sm:text-xl">Every line is a new beginning.</p>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">程式作業繳交與管理平台<br /><span lang="en">Your workspace for coding assignments.</span></p>
          <div aria-hidden="true" className="mt-8 hidden max-w-lg -rotate-2 overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:block">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <span className="h-2 w-2 rounded-full bg-primary/70" /><span className="h-2 w-2 rounded-full bg-primary/40" /><span className="h-2 w-2 rounded-full bg-primary/20" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">a-new-start.ts</span>
            </div>
            <div className="space-y-3 p-6 font-mono text-sm">
              <p className="text-muted-foreground">// Great things start with a little code.</p>
              <p><span className="text-primary">const</span> journey = {"{"}</p>
              <p className="pl-5">curiosity: <span className="text-primary">true</span>,</p>
              <p className="pl-5">possibilities: <span className="text-primary">Infinity</span>,</p>
              <p>{"}"};</p>
              <p className="pt-2 text-primary">journey.begin(); <span className="inline-block h-4 w-2 translate-y-0.5 bg-primary/60" /></p>
            </div>
          </div>
        </section>
        <section aria-labelledby="login-title" className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm sm:p-10">
          <p className="mb-2 font-mono text-xs tracking-widest text-primary">LET’S GET STARTED</p>
          <h2 id="login-title" className="text-2xl font-bold tracking-tight">登入 <span lang="en" className="ml-1 font-normal text-muted-foreground">Sign in</span></h2>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="course" className="block text-sm font-medium">課程 <span lang="en" className="ml-1 font-normal text-muted-foreground">Course</span></label>
              <select id="course" name="course" required defaultValue="" className={inputClass}>
                <option value="" disabled>請選擇 / Select a course</option>
                <option value="程式設計（一）">程式設計（一） / Programming I</option>
                <option value="資料結構">資料結構 / Data Structures</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="account" className="block text-sm font-medium">帳號 <span lang="en" className="ml-1 font-normal text-muted-foreground">Username</span></label>
              <input id="account" name="username" autoComplete="username" required placeholder="請輸入帳號 / Username" className={inputClass} />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">密碼 <span lang="en" className="ml-1 font-normal text-muted-foreground">Password</span></label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="請輸入密碼 / Password" className={`${inputClass} pr-14`} />
                <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "隱藏密碼 / Hide password" : "顯示密碼 / Show password"} aria-pressed={showPassword} className="absolute top-1 right-1 flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {notice && <p role="alert" className="text-sm leading-6 text-destructive">{notice}</p>}
            <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">登入 / Sign in<ArrowRight size={17} /></button>
          </form>

        </section>
      </main>
      <footer className="mx-6 border-t border-border py-6 text-center text-xs leading-6 text-muted-foreground sm:mx-10">
        <p>Copyright © {new Date().getFullYear()} J.D.I.哲哲. <span lang="en">All rights reserved.</span></p>
      </footer>
    </div>
  )
}
