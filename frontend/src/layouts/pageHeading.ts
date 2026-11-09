type NamedRecord = { id: string; code: string; title: string }
type StudentRecord = { id: string; studentNumber: string; name: string }

export type PageHeading = {
  title: string
  parent?: { title: string; to: string }
  section?: string
}

export function getPageHeading(
  pathname: string,
  data: { problems: NamedRecord[]; students: StudentRecord[] },
): PageHeading {
  const [module, id, section] = pathname.split("/").filter(Boolean)

  if (module === "students") {
    if (!id) return { title: "學生管理" }
    const parent = { title: "學生管理", to: "/students" }
    if (id === "import") return { title: "Excel 批次匯入學生", parent }
    const student = data.students.find((item) => item.id === id)
    return {
      title: student ? `${student.studentNumber} · ${student.name}` : "學生詳細資料",
      parent,
      section: "學生詳細資料",
    }
  }

  if (module === "problems") {
    if (!id) return { title: "題目管理" }
    const parent = { title: "題目管理", to: "/problems" }
    if (id === "new") return { title: "新增題目", parent }
    if (section === "details") return { title: "題目詳情", parent }
    const problem = data.problems.find((item) => item.id === id)
    return {
      title: problem ? `${problem.code} · ${problem.title}` : "編輯題目",
      parent,
      section: "編輯題目",
    }
  }

  const titles: Record<string, string> = {
    assignments: "作業管理",
    dashboard: "儀表板",
    submissions: "繳交紀錄",
    grades: "成績管理",
  }
  return { title: titles[module] ?? "工作區" }
}
