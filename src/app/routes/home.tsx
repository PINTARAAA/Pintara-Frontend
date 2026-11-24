import pintaraLogo from "@/assets/pintara-logo.png"

/*
 * Beranda sementara. Ganti dengan layar dari page "UI Screen" di Figma
 * setelah layout dan fitur mulai dibangun.
 */
export default function HomeRoute() {
  return (
    <main className="grid min-h-dvh place-items-center bg-grayscale-surface-subtitle p-ns-2xl">
      <div className="flex max-w-md flex-col items-center gap-ns-l text-center">
        <img src={pintaraLogo} alt="" className="size-16" />
        <h1 className="text-h4 font-bold text-grayscale-text-title">Pintara</h1>
        <p className="text-subtitle leading-normal text-grayscale-text-subtitle">
          Fondasi design system sudah siap. Halaman akan dibangun dari page
          UI Screen di Figma.
        </p>
      </div>
    </main>
  )
}
