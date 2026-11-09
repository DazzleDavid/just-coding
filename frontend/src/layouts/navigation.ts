import { BookOpen, ChartNoAxesColumn, Inbox, LayoutDashboard, Users, Library } from "lucide-react"

export const navigation = [
  { id: "dashboard", title: "儀表板", icon: LayoutDashboard },
  { id: "assignments", title: "作業管理", icon: BookOpen },
  { id: "problems", title: "題目管理", icon: Library },
  { id: "submissions", title: "繳交紀錄", icon: Inbox },
  { id: "grades", title: "查看成績", icon: ChartNoAxesColumn },
  { id: "students", title: "學生管理", icon: Users },
] as const
