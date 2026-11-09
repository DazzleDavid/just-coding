import { useSearchParams } from "react-router"

export function useGradeFilters() {
  const [params, setParams] = useSearchParams()
  const value = (key: string, fallback = "") => params.get(key) ?? fallback
  function update(patch: Record<string, string>, resetPage = true) {
    const next = new URLSearchParams(params)
    if (resetPage) next.delete("page")
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    setParams(next, { replace: true })
  }
  return { params, value, update, reset: () => setParams({}, { replace: true }) }
}
