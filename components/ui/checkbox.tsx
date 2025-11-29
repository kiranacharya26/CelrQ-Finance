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
            <div className="relative inline-flex items-center justify-center">
                <input
                    type="checkbox"
                    className={cn(
                        "peer h-4 w-4 shrink-0 appearance-none rounded border-2 border-input bg-background transition-all",
                        "hover:border-primary/50",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "checked:bg-primary checked:border-primary",
                        className
                    )}
                    ref={ref}
                    onChange={handleChange}
                    {...props}
                />
                <Check className="h-3 w-3 absolute text-primary-foreground pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
