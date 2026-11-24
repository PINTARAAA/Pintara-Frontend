"use client"

import * as React from "react"
import { ChevronDownIcon, ChevronUpIcon, ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/*
 * Table · Figma PINTARA → Components → 05 · Data Display → Data table
 *
 * Wadah ber-border Grayscale/Border/default, radius 8. Header: latar
 * Grayscale/Surface/subtitle, tinggi 48, Caption/Bold Grayscale/Text/caption.
 * Baris: tinggi 64, garis bawah Grayscale/Border/default, hover
 * Grayscale/Surface/subtitle. Sel: padding horizontal 16, teks 13.
 *
 * Kolom yang bisa diurutkan: <TableHead sortDirection="desc" onSort={…}>.
 * Untuk tampilan lengkap seperti Figma (judul, filter, paginasi), gabungkan
 * dengan <Input>/<Select>/<DateRangePicker>, <PaginationBar>, dan <DataState>
 * untuk keadaan loading/kosong/error.
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto rounded-(--comp-radius-sm) border border-grayscale-border-default bg-grayscale-surface-default"
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom border-collapse text-subtitle text-grayscale-text-body",
          className
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "bg-grayscale-surface-subtitle [&_tr]:border-b [&_tr]:border-grayscale-border-default [&_tr]:hover:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-grayscale-border-default bg-grayscale-surface-subtitle font-bold [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-grayscale-border-default transition-colors hover:bg-grayscale-surface-subtitle has-aria-expanded:bg-grayscale-surface-subtitle data-[state=selected]:bg-primary-surface-subtitle",
        className
      )}
      {...props}
    />
  )
}

function TableHead({
  className,
  sortDirection,
  onSort,
  children,
  ...props
}: React.ComponentProps<"th"> & {
  /* Isi untuk kolom yang bisa diurutkan; false = belum diurutkan */
  sortDirection?: "asc" | "desc" | false
  onSort?: () => void
}) {
  const sortable = sortDirection !== undefined
  const SortIcon =
    sortDirection === "asc"
      ? ChevronUpIcon
      : sortDirection === "desc"
        ? ChevronDownIcon
        : ChevronsUpDownIcon

  return (
    <th
      data-slot="table-head"
      aria-sort={
        sortDirection === "asc"
          ? "ascending"
          : sortDirection === "desc"
            ? "descending"
            : sortable
              ? "none"
              : undefined
      }
      className={cn(
        "h-12 px-ns-l text-left align-middle text-caption leading-normal font-bold whitespace-nowrap text-grayscale-text-caption [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          className="-mx-ns-2xs inline-flex items-center gap-ns-s rounded-sm px-ns-2xs py-ns-3xs font-bold text-grayscale-text-caption outline-none hover:text-grayscale-text-body focus-visible:ring-2 focus-visible:ring-primary-border-lighter"
        >
          {children}
          <SortIcon aria-hidden="true" className="size-4 shrink-0" />
        </button>
      ) : (
        children
      )}
    </th>
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "h-16 px-ns-l align-middle leading-normal whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

/* Sel identitas: baris utama tebal + baris kedua Caption (mis. nama + ID) */
function TableCellStack({
  primary,
  secondary,
  className,
}: {
  primary: React.ReactNode
  secondary?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-ns-2xs", className)}>
      <span className="font-bold text-grayscale-text-body">{primary}</span>
      {secondary != null && (
        <span className="text-caption text-grayscale-text-caption">
          {secondary}
        </span>
      )}
    </div>
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-ns-l text-caption text-grayscale-text-caption", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCellStack,
  TableCaption,
}
