import { Skeleton } from "@/components"

/*
 * Kerangka saat beranda dimuat. Bentuknya mengikuti tata letak asli
 * (kartu utama + dua bagian daftar) agar tidak ada lompatan layout.
 */
function SkeletonListCard({ rows = 2 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-ns-m">
      <Skeleton className="h-4 w-32" />
      <div className="flex flex-col rounded-(--comp-radius-md) border border-grayscale-border-disabled bg-grayscale-surface-default">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-ns-m px-ns-l py-ns-m">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-ns-s">
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-2 w-2/5 bg-grayscale-surface-subtitle" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Memuat beranda" className="grid gap-ns-2xl lg:grid-cols-2">
      <Skeleton className="h-50 rounded-(--comp-radius-md)" />
      <SkeletonListCard />
      <SkeletonListCard rows={1} />
      <SkeletonListCard />
    </div>
  )
}

export { DashboardSkeleton }
