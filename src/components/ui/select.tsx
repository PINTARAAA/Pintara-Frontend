"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"
import {
  cn,
  fieldControlVariants,
  fieldHeight,
  type FieldSize,
} from "@/lib/styles"

/*
 * Select · Figma PINTARA → Components → 02 · Form Controls → Select + Dropdown
 * Trigger memakai gaya Input (sm · default/Medium · lg). Popup = "Dropdown":
 * border Grayscale/Border/default, padding & gap 4px. Item = ".Dropdown item":
 * ukuran mengikuti Token Komponen; selected → Primary/Surface/subtitle + centang.
 * Beri `size` yang sama pada <SelectTrigger> dan <SelectContent>.
 */

const Select = SelectPrimitive.Root

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  )
}

const chevronSize: Record<FieldSize, string> = {
  sm: "size-(--comp-icon-sm)",
  default: "size-(--comp-icon-md)",
  lg: "size-(--comp-icon-lg)",
}

function SelectTrigger({
  className,
  size = "default",
  icon,
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: FieldSize
  /* Ganti chevron, mis. ikon jam pada Time picker */
  icon?: React.ReactElement<{ className?: string }>
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        fieldControlVariants({ size }),
        fieldHeight[size],
        "group/select-trigger flex items-center justify-between gap-(--comp-gap-md) text-left whitespace-nowrap data-placeholder:text-grayscale-text-subtitle data-popup-open:border-primary-border-default data-popup-open:ring-1 data-popup-open:ring-primary-border-default data-popup-open:ring-inset *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          icon ? (
            React.cloneElement(icon, {
              className: cn(
                "pointer-events-none text-grayscale-text-body",
                chevronSize[size],
                icon.props.className
              ),
            })
          ) : (
            <ChevronDownIcon
              className={cn(
                "pointer-events-none text-grayscale-text-body transition-transform group-data-popup-open/select-trigger:rotate-180",
                chevronSize[size]
              )}
            />
          )
        }
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = false,
  size = "default",
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  > & { size?: FieldSize }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          data-size={size}
          className={cn("group/select-content relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto border border-grayscale-border-default bg-grayscale-surface-default p-ns-2xs text-grayscale-text-body shadow-md duration-100 data-[size=default]:rounded-(--comp-radius-md) data-[size=lg]:rounded-(--comp-radius-lg) data-[size=sm]:rounded-(--comp-radius-sm) data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List className="flex flex-col gap-ns-2xs">
            {children}
          </SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-ns-m py-ns-s text-caption font-bold text-grayscale-text-caption", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center font-normal text-grayscale-text-body outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
        /* Ukuran mengikuti size pada <SelectContent> */
        "min-h-12 gap-(--comp-gap-md) rounded-(--comp-radius-md) px-(--comp-px-md) py-(--comp-py-md) text-subtitle [&_svg]:size-(--comp-icon-md)",
        "group-data-[size=sm]/select-content:min-h-9 group-data-[size=sm]/select-content:gap-(--comp-gap-sm) group-data-[size=sm]/select-content:rounded-(--comp-radius-sm) group-data-[size=sm]/select-content:px-(--comp-px-sm) group-data-[size=sm]/select-content:py-(--comp-py-sm) group-data-[size=sm]/select-content:[&_svg]:size-(--comp-icon-sm)",
        "group-data-[size=lg]/select-content:min-h-16 group-data-[size=lg]/select-content:gap-(--comp-gap-lg) group-data-[size=lg]/select-content:rounded-(--comp-radius-lg) group-data-[size=lg]/select-content:px-(--comp-px-lg) group-data-[size=lg]/select-content:py-(--comp-py-lg) group-data-[size=lg]/select-content:text-body group-data-[size=lg]/select-content:[&_svg]:size-(--comp-icon-lg)",
        /* State: hover · selected · disabled */
        /* Base UI memasang data-selected="" (bukan "true"), jadi pakai data-[selected] */
        "not-data-[selected]:data-highlighted:bg-grayscale-surface-subtitle data-[selected]:bg-primary-surface-subtitle data-[selected]:text-primary-text-primary data-disabled:pointer-events-none data-disabled:bg-grayscale-surface-disabled",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex min-w-0 flex-1 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none flex items-center justify-center text-primary-text-primary" />
        }
      >
        <CheckIcon className="pointer-events-none" strokeWidth={2} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-grayscale-border-disabled", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-grayscale-surface-default py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-grayscale-surface-default py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
