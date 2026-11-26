import { ConstructionIcon } from "lucide-react"
import { Link, useLocation, useMatches } from "react-router"

import { TabScreen, Button, DataState } from "@/components"

/*
 * SEMENTARA · pengganti layar tab yang belum dibangun. Judul diambil dari
 * `handle.title` pada route. Hapus route-nya setelah layar asli dibuat.
 */
type Handle = { title?: string }

export default function PlaceholderRoute() {
  const matches = useMatches()
  const role = useLocation().pathname.split("/")[1]
  const title =
    (matches.at(-1)?.handle as Handle | undefined)?.title ?? "Halaman"

  return (
    <TabScreen title={title}>
      <DataState
        state="empty"
        icon={<ConstructionIcon />}
        title="Sedang dibangun"
        description={`Layar "${title}" masih dalam tahap pembangunan ya!`}
      />
      <Button
        variant="secondary"
        nativeButton={false}
        render={<Link to={`/${role}/contoh`} />}
      >
        Lihat contoh layar detail
      </Button>
    </TabScreen>
  )
}
