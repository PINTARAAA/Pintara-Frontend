import * as React from "react"

export function useExpandable<T>(items: T[], preview: number) {
  const [expanded, setExpanded] = React.useState(false)
  return {
    visible: expanded ? items : items.slice(0, preview),
    hidden: items.length - preview,
    expanded,
    toggle: () => setExpanded((v) => !v),
  }
}
