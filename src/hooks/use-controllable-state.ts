import * as React from "react"

/*
 * State yang bisa dikontrol dari luar (controlled: `value` + `onChange`)
 * atau dikelola sendiri (uncontrolled: `defaultValue`), seperti <input>.
 *
 *   const [open, setOpen] = useControllableState({
 *     value: props.open,
 *     defaultValue: false,
 *     onChange: props.onOpenChange,
 *   })
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T
  defaultValue: T
  onChange?: (value: T) => void
}) {
  const [inner, setInner] = React.useState(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : inner

  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setInner(next)
      onChange?.(next)
    },
    [isControlled, onChange]
  )

  return [current, setValue] as const
}
