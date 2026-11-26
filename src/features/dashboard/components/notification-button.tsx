import { BellIcon } from "lucide-react"
import { useNavigate } from "react-router"

import { TopAppBarButton } from "@/components"

/* Lonceng notifikasi di Top app bar beranda; titik merah bila ada yang belum dibaca */
function NotificationButton({ to, unread = 0 }: { to: string; unread?: number }) {
  const navigate = useNavigate()
  return (
    <TopAppBarButton
      label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
      dot={unread > 0}
      onClick={() => navigate(to)}
    >
      <BellIcon />
    </TopAppBarButton>
  )
}

export { NotificationButton }
