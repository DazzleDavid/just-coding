import { useId, type ReactNode } from "react"

export function FormField({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: (id: string, descriptionId?: string) => ReactNode }) {
  const id = useId()
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium">{label}{required && <sup className="ml-1 text-destructive" aria-label="必填">*</sup>}</label>
    {children(id, error ? `${id}-error` : undefined)}
    {error && <p id={`${id}-error`} className="text-sm text-destructive">{error}</p>}
  </div>
}
