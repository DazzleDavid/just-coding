export type StudentDraft = {
  studentNumber: string
  name: string
  email: string
  className: string
  notes: string
}

export type Student = StudentDraft & {
  id: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type StudentErrors = Partial<Record<keyof StudentDraft, string>>
export const emptyStudent: StudentDraft = { studentNumber: "", name: "", email: "", className: "", notes: "" }

export function normalizeStudent(draft: StudentDraft): StudentDraft {
  return {
    studentNumber: draft.studentNumber.trim(),
    name: draft.name.trim(),
    email: draft.email.trim(),
    className: draft.className.trim(),
    notes: draft.notes.trim(),
  }
}

export function validateStudent(draft: StudentDraft, students: Student[], editingId?: string): StudentErrors {
  const errors: StudentErrors = {}
  if (!draft.studentNumber) errors.studentNumber = "學號不可空白。"
  if (!draft.name) errors.name = "姓名不可空白。"
  if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) errors.email = "請輸入有效的 Email。"
  if (draft.notes.length > 200) errors.notes = "備註最多 200 字。"
  const others = students.filter((student) => student.id !== editingId)
  if (others.some((student) => student.studentNumber === draft.studentNumber)) errors.studentNumber = "學號與既有資料重複。"
  if (draft.email && others.some((student) => student.email.toLowerCase() === draft.email.toLowerCase())) errors.email = "Email 與既有資料重複。"
  return errors
}

export function createStudent(draft: StudentDraft): Student {
  const now = new Date().toISOString()
  return { ...normalizeStudent(draft), id: crypto.randomUUID(), active: true, createdAt: now, updatedAt: now }
}

export function seedStudents(): Student[] {
  const names = ["陳怡安", "林柏宇", "黃品蓁", "張書豪", "李佳穎", "王子軒", "劉思妤", "蔡承恩", "吳宥廷", "Alex Chen", "Emma Lin", "許庭瑜"]
  return Array.from({ length: 120 }, (_, index) => ({
    studentNumber: `011${String(index + 1).padStart(4, "0")}`,
    name: `${names[index % names.length]}${index < names.length ? "" : ` ${Math.floor(index / names.length) + 1}`}`,
    email: `student${String(index + 1).padStart(3, "0")}@example.edu`,
    className: index % 2 === 0 ? "資工一甲" : "資工一乙",
    notes: "", id: `student-${index + 1}`, active: index < 115,
    createdAt: "2026-11-01T00:00:00.000Z", updatedAt: "2026-11-01T00:00:00.000Z",
  }))
}
