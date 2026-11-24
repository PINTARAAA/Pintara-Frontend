import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"

import { cn } from "@/lib/styles/cn"

/*
 * Tabs · Figma PINTARA → Components → 04 · Navigation → Tabs + ".Tab item"
 *
 * Satu ukuran, tinggi 48px, 2–4 tab. State item:
 *   default  : Grayscale/Surface/default, teks Grayscale/Text/body
 *   hover    : Grayscale/Surface/subtitle
 *   active   : teks tebal Primary/Text/primary + garis bawah 2px Primary/Border/default
 *   disabled : Grayscale/Surface/disabled (teks tetap terbaca)
 * Counter opsional: <TabsCount>24</TabsCount> di dalam <TabsTrigger>.
 */
function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-ns-l data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "group/tabs-list inline-flex w-fit items-end group-data-vertical/tabs:flex-col group-data-vertical/tabs:items-stretch",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "group/tabs-trigger relative inline-flex h-12 items-center justify-center gap-ns-s rounded-t-md border-b-2 border-transparent bg-grayscale-surface-default px-ns-l text-subtitle leading-none font-normal whitespace-nowrap text-grayscale-text-body transition-colors outline-none",
        "hover:bg-grayscale-surface-subtitle focus-visible:ring-2 focus-visible:ring-primary-border-lighter focus-visible:ring-inset",
        "data-active:border-primary-border-default data-active:font-bold data-active:text-primary-text-primary data-active:hover:bg-grayscale-surface-default",
        "data-disabled:pointer-events-none data-disabled:bg-grayscale-surface-disabled",
        "group-data-vertical/tabs:justify-start group-data-vertical/tabs:rounded-none group-data-vertical/tabs:rounded-l-md group-data-vertical/tabs:border-b-0 group-data-vertical/tabs:border-r-2",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        className
      )}
      {...props}
    />
  )
}

/* Counter 20px: abu-abu saat default, Primary/Surface/subtitle saat aktif */
function TabsCount({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="tabs-count"
      className={cn(
        "inline-flex h-5 items-center justify-center rounded-md bg-grayscale-surface-disabled px-ns-xs text-caption font-normal text-grayscale-text-body tabular-nums",
        "group-data-active/tabs-trigger:bg-primary-surface-subtitle group-data-active/tabs-trigger:text-primary-text-primary",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-subtitle outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsCount, TabsContent }
