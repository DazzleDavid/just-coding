import { useState } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { Code2, Menu, X } from "lucide-react"
import { NavLink } from "react-router"
import { navigation } from "../../layouts/navigation"
import { outlineButton } from "../ui/styles"

const linkStyle = (active: boolean) => `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring ${active ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`

function Copyright() {
  return <footer className="shrink-0 border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground"><p>Copyright © {new Date().getFullYear()} J.D.I.哲哲.</p><p>版權所有。<span lang="en">All rights reserved.</span></p></footer>
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeMobile = () => setMobileOpen(false)

  const brand = <div className="flex min-h-[72px] shrink-0 items-center gap-3 border-b border-border px-4 py-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Code2 size={22} /></span><div className="min-w-0"><p className="truncate font-bold">Just Coding.</p><p className="truncate text-xs text-muted-foreground">Management Console</p></div></div>
  const links = <nav aria-label="主要導覽" className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
    {navigation.map(({ id, title, icon: Icon }) => <NavLink key={id} to={`/${id}`} onClick={closeMobile} className={({ isActive }) => linkStyle(isActive)}><Icon size={18} /><span>{title}</span></NavLink>)}
  </nav>

  return <>
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border bg-card md:flex">{brand}{links}<Copyright /></aside>
    <div className="flex min-h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:hidden"><span className="font-bold">Just Coding.</span><Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}><Dialog.Trigger className={outlineButton} aria-label="開啟導覽選單"><Menu size={20} /></Dialog.Trigger><Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50" /><Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[90vw] flex-col border-r border-border bg-card text-foreground"><Dialog.Title className="sr-only">工作區導覽</Dialog.Title><Dialog.Close aria-label="關閉導覽" className="absolute top-5 right-2 rounded p-1 focus-visible:outline-2 focus-visible:outline-ring"><X size={18} /></Dialog.Close>{brand}{links}<Copyright /></Dialog.Popup></Dialog.Portal></Dialog.Root></div>
  </>
}
