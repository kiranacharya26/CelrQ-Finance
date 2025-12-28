"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, onCheckedChange, onChange, ...props }, ref) => {
        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(event)
            onCheckedChange?.(event.target.checked)
        }

        return (
            <div className={cn("relative inline-flex items-center justify-center shrink-0 aspect-square min-h-0", className)}>
                <input
                    type="checkbox"
                    className={cn(
                        "peer h-full w-full appearance-none rounded border-2 border-input bg-background transition-all",
                        "hover:border-primary/50",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "checked:bg-primary checked:border-primary"
                    )}
                    ref={ref}
                    onChange={handleChange}
                    {...props}
                />
                <Check className="h-[70%] w-[70%] absolute text-primary-foreground pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
