type NamedRecord = { id: string; code: string; title: string }
type StudentRecord = { id: string; studentNumber: string; name: string }

export type PageHeading = {
  title: string
  parent?: { title: string; to: string }
  section?: string
}

export function getPageHeading(
  pathname: string,
  data: { problems: NamedRecord[]; assignments: NamedRecord[]; students: StudentRecord[] },
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

  if (module === "assignments") {
    if (!id) return { title: "作業管理" }
    const parent = { title: "作業管理", to: "/assignments" }
    if (id === "new") return { title: "新增作業", parent }
    const assignment = data.assignments.find((item) => item.id === id)
    return {
      title: assignment ? `${assignment.code} · ${assignment.title}` : "作業詳情",
      parent,
      section: section === "edit" ? "編輯作業設定" : "作業詳情",
    }
  }

  if (module === "grades") {
    const root = { title: "查看成績", to: "/grades" }
    if (!id) return { title: "查看成績" }
    if (id === "students") {
      const student = data.students.find((item) => item.id === section)
      return section
        ? {
            title: student ? `${student.studentNumber} · ${student.name}` : "學生成績詳情",
            parent: { title: "學生成績", to: "/grades/students" },
            section: "學生成績",
          }
        : { title: "學生成績", parent: root }
    }
    if (id === "assignments") {
      const assignment = data.assignments.find((item) => item.id === section)
      return section
        ? {
            title: assignment ? `${assignment.code} · ${assignment.title}` : "作業成績詳情",
            parent: { title: "作業成績", to: "/grades/assignments" },
            section: "作業成績",
          }
        : { title: "作業成績", parent: root }
    }
    return { title: "提交成績", parent: root }
  }
  if (module === "submissions" && id)
    return { title: "程式碼提交詳情", parent: { title: "繳交紀錄", to: "/submissions" } }

  const titles: Record<string, string> = {
    exports: "匯出成績",
    dashboard: "儀表板",
    submissions: "繳交紀錄",
    grades: "查看成績",
  }
  return { title: titles[module] ?? "工作區" }
}
