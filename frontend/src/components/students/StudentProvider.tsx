import { useRef, useState, type ReactNode } from "react"
import { createStudent, normalizeStudent, validateStudent, type Student, type StudentDraft } from "../../lib/students"
import { StudentContext } from "./StudentStore"

const storageKey = "just-coding-students-v2"
function loadStudents(): Student[] {
  // Retire the previous mock dataset once; future additions use the new key.
  localStorage.removeItem("just-coding-students-v1")
  const raw = localStorage.getItem(storageKey)
  if (!raw) return []
  const data: unknown = JSON.parse(raw)
  if (!Array.isArray(data) || !data.every((item) => item && ["id", "studentNumber", "name", "email", "className", "notes", "createdAt", "updatedAt"].every((key) => typeof item[key] === "string") && typeof item.active === "boolean")) throw new Error("學生資料格式不正確")
  return data
}

export function StudentProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try { return { students: loadStudents(), error: "" } }
    catch { return { students: [], error: "無法讀取已儲存資料，目前顯示空白列表。請檢查瀏覽器儲存權限。" } }
  })
  const [students, setStudents] = useState(initial.students)
  const current = useRef(students)
  const [loadError, setLoadError] = useState(initial.error)

  function persist(next: Student[]) {
    try { localStorage.setItem(storageKey, JSON.stringify(next)) }
    catch { throw new Error("儲存失敗，請確認瀏覽器儲存空間與權限後再試。") }
    current.current = next
    setStudents(next)
  }

  function saveStudent(raw: StudentDraft, id?: string) {
    const draft = normalizeStudent(raw)
    const existing = current.current.find((student) => student.id === id)
    if (id && !existing) throw new Error("找不到學生。")
    if (existing && existing.studentNumber !== draft.studentNumber) throw new Error("學號不可修改。")
    const errors = validateStudent(draft, current.current, id)
    if (Object.keys(errors).length) throw new Error(Object.values(errors).join(" "))
    persist(id ? current.current.map((student) => student.id === id ? { ...student, ...draft, updatedAt: new Date().toISOString() } : student) : [createStudent(draft), ...current.current])
  }

  function setActive(id: string, active: boolean) {
    if (!current.current.some((student) => student.id === id)) throw new Error("找不到學生。")
    persist(current.current.map((student) => student.id === id ? { ...student, active, updatedAt: new Date().toISOString() } : student))
  }

  function addStudents(drafts: StudentDraft[]) {
    const next = [...current.current]
    for (const raw of drafts) {
      const draft = normalizeStudent(raw)
      if (Object.keys(validateStudent(draft, next)).length) throw new Error("資料已變更或存在重複，請重新驗證後再匯入。")
      next.push(createStudent(draft))
    }
    persist(next)
  }

  return <StudentContext.Provider value={{ students, saveStudent, setActive, addStudents }}>
    {loadError && <div role="alert" className="flex items-center justify-between gap-4 border-b border-border bg-accent px-6 py-3 text-sm text-foreground"><span>{loadError}</span><button type="button" className="min-h-10 rounded px-3 focus-visible:outline-2 focus-visible:outline-ring" onClick={() => setLoadError("")}>關閉</button></div>}
    {children}
  </StudentContext.Provider>
}
