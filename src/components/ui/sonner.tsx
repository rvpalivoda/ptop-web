import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"
import { X } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            position="bottom-right"
            offset="calc(env(safe-area-inset-bottom, 0px) + 16px)"
            className="toaster pointer-events-none group"
            toastOptions={{
                duration: 2000,
                classNames: {
                    toast: `
            relative pointer-events-auto group toast
            bg-white/5 text-white/80 ring-1 ring-white/10
            backdrop-blur-md shadow-lg rounded-xl
            px-4 py-3 text-sm font-medium
          `,
                    title: "text-white",
                    description: "text-white/60",
                },
            }}
            {...props}
        />
    )
}

export { Toaster, toast }
