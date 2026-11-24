import { useMatches } from "react-router"

import { DetailScreen } from "@/components/layouts/detail-screen"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/toast-api"

/*
 * SEMENTARA · contoh layar detail untuk mencoba DetailScreen (tanpa bottom
 * navigation, dengan bilah aksi bawah). Hapus setelah layar asli dibuat.
 */
export default function PlaceholderDetailRoute() {
  const title =
    (useMatches().at(-1)?.handle as { title?: string } | undefined)?.title ??
    "Detail"

  return (
    <DetailScreen
      title={title}
      footer={
        <Button
          variant="secondary"
          onClick={() => toast.info("Ini hanya contoh aksi")}
        >
          Contoh Aksi
        </Button>
      }
    >
      <Card size="compact">
        <CardHeader>
          <CardTitle>Layar detail</CardTitle>
        </CardHeader>
        <CardContent>
          Layar turunan memakai top app bar dengan tombol kembali dan tampil
          tanpa bottom navigation.
        </CardContent>
      </Card>
    </DetailScreen>
  )
}
