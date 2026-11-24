import * as React from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/styles/cn"

/*
 * PasswordInput · Input password dengan tombol tampil/sembunyikan
 * (Figma: Login → "Toggle password visibility", ikon 20px di kanan, 20px
 * dari tepi). Ikon Eye Off saat password tersembunyi.
 */
function PasswordInput({
  className,
  size = "default",
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = React.useState(false)
  const Icon = visible ? EyeIcon : EyeOffIcon

  return (
    <div data-slot="password-input" className="relative w-full">
      <Input
        type={visible ? "text" : "password"}
        size={size}
        className={cn("pr-12", className)}
        {...props}
      />
      <button
        type="button"
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        disabled={props.disabled}
        className="absolute top-1/2 right-ns-m flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-grayscale-text-body outline-none hover:bg-grayscale-surface-subtitle focus-visible:ring-2 focus-visible:ring-primary-border-lighter disabled:pointer-events-none disabled:text-grayscale-text-disabled"
      >
        <Icon className="size-5" />
      </button>
    </div>
  )
}

export { PasswordInput }
