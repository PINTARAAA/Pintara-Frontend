/* Tampilan saat halaman (route lazy) pertama kali diunduh */
export function PageLoader() {
  return (
    <div
      role="status"
      className="grid min-h-dvh place-items-center bg-grayscale-surface-subtitle text-caption text-grayscale-text-caption"
    >
      Memuat halaman…
    </div>
  )
}
