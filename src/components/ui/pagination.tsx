import * as React from "react"
import { MoreHorizontalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/styles"

/*
 * Pagination · Figma PINTARA → Components → 04 · Navigation → Pagination
 *
 * Tombol memakai Button size sm: halaman aktif = primary, halaman lain =
 * tertiary, "Sebelumnya"/"Berikutnya" = secondary. "Sebelumnya" tidak tampil
 * di halaman pertama (dan "Berikutnya" tidak tampil di halaman terakhir).
 *
 * Pakai <PaginationBar> untuk versi lengkap (baris per halaman + ringkasan +
 * navigasi), atau susun sendiri dari primitive di bawah.
 */
function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="Navigasi halaman"
      data-slot="pagination"
      className={cn("flex", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-ns-2xs", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & React.ComponentProps<"a">

/* Nomor halaman sebagai tautan (untuk paginasi berbasis URL) */
function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "primary" : "tertiary"}
      size="sm"
      className={cn("min-w-9", className)}
      nativeButton={false}
      render={
        <a
          aria-current={isActive ? "page" : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          {...props}
        />
      }
    />
  )
}

function PaginationPrevious({
  className,
  text = "Sebelumnya",
  ...props
}: React.ComponentProps<"a"> & { text?: string }) {
  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      nativeButton={false}
      render={<a aria-label="Halaman sebelumnya" data-slot="pagination-previous" {...props} />}
    >
      {text}
    </Button>
  )
}

function PaginationNext({
  className,
  text = "Berikutnya",
  ...props
}: React.ComponentProps<"a"> & { text?: string }) {
  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      nativeButton={false}
      render={<a aria-label="Halaman berikutnya" data-slot="pagination-next" {...props} />}
    >
      {text}
    </Button>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-9 items-center justify-center text-primary-text-link [&_svg:not([class*='size-'])]:size-5",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className="sr-only">Halaman lainnya</span>
    </span>
  )
}

/* Nomor halaman yang ditampilkan: selalu 1 & terakhir, plus tetangga halaman aktif */
function getPageItems(page: number, pageCount: number, siblings = 1) {
  const pages = new Set<number>([1, pageCount])
  for (let p = page - siblings; p <= page + siblings; p++) {
    if (p >= 1 && p <= pageCount) pages.add(p)
  }
  const sorted = [...pages].sort((a, b) => a - b)
  const items: (number | "ellipsis")[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push("ellipsis")
    items.push(p)
  })
  return items
}

/*
 * PaginationBar · versi lengkap sesuai Figma:
 * [Baris per halaman ⌄]  Menampilkan 1–8 dari 24 …        [1] 2 3 [Berikutnya]
 */
function PaginationBar({
  page,
  pageCount,
  onPageChange,
  pageSize,
  pageSizeOptions = [8, 16, 24, 48],
  onPageSizeChange,
  totalItems,
  itemLabel = "data",
  summary,
  className,
}: {
  /* Halaman aktif, dimulai dari 1 */
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  pageSize?: number
  pageSizeOptions?: number[]
  /* Jika diisi, kontrol "Baris per halaman" ditampilkan */
  onPageSizeChange?: (size: number) => void
  totalItems?: number
  /* Kata benda pada ringkasan, mis. "pendaftaran" */
  itemLabel?: string
  /* Ganti teks ringkasan bawaan */
  summary?: React.ReactNode
  className?: string
}) {
  const defaultSummary =
    totalItems != null && pageSize != null
      ? totalItems === 0
        ? `Tidak ada ${itemLabel}`
        : `Menampilkan ${(page - 1) * pageSize + 1}–${Math.min(
            page * pageSize,
            totalItems
          )} dari ${totalItems} ${itemLabel}`
      : null

  return (
    <div
      data-slot="pagination-bar"
      className={cn(
        "flex flex-wrap items-center gap-x-ns-2xl gap-y-ns-m bg-grayscale-surface-default",
        className
      )}
    >
      {onPageSizeChange && pageSize != null && (
        <div className="flex items-center gap-ns-m">
          <span className="text-subtitle text-grayscale-text-body">
            Baris per halaman
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger aria-label="Baris per halaman" className="w-auto min-w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <p className="min-w-0 flex-1 text-subtitle text-grayscale-text-caption">
        {summary ?? defaultSummary}
      </p>

      {pageCount > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label="Halaman sebelumnya"
                  onClick={() => onPageChange(page - 1)}
                >
                  Sebelumnya
                </Button>
              </PaginationItem>
            )}
            {getPageItems(page, pageCount).map((item, i) =>
              item === "ellipsis" ? (
                <PaginationItem key={`e${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <Button
                    variant={item === page ? "primary" : "tertiary"}
                    size="sm"
                    className="min-w-9"
                    aria-current={item === page ? "page" : undefined}
                    aria-label={`Halaman ${item}`}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </Button>
                </PaginationItem>
              )
            )}
            {page < pageCount && (
              <PaginationItem>
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label="Halaman berikutnya"
                  onClick={() => onPageChange(page + 1)}
                >
                  Berikutnya
                </Button>
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

export {
  Pagination,
  PaginationBar,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
