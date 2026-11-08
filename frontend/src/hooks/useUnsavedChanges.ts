import { useCallback, useRef } from "react"
import { useBeforeUnload, useBlocker } from "react-router"

export function useUnsavedChanges(dirty: boolean, options: { includeSearch?: boolean } = {}) {
  const saved = useRef(false)
  useBeforeUnload(
    useCallback(
      (event) => {
        if (dirty && !saved.current) {
          event.preventDefault()
          event.returnValue = ""
        }
      },
      [dirty],
    ),
  )
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      !saved.current &&
      (currentLocation.pathname !== nextLocation.pathname ||
        (!!options.includeSearch &&
          (currentLocation.search !== nextLocation.search ||
            currentLocation.hash !== nextLocation.hash))),
  )
  const markSaved = useCallback(() => {
    saved.current = true
  }, [])
  const markDirty = useCallback(() => {
    saved.current = false
  }, [])
  return { blocker, markSaved, markDirty }
}
