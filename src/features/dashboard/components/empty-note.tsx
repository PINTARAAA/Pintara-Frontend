import * as React from "react"

/* Pesan singkat saat satu bagian beranda tidak punya isi */
function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-(--comp-radius-md) border border-dashed border-grayscale-border-default bg-grayscale-surface-default px-ns-l py-ns-m text-caption text-grayscale-text-caption">
      {children}
    </p>
  )
}

export { EmptyNote }
