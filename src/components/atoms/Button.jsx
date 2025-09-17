import { forwardRef } from "react"
import { cn } from "@/utils/cn"

const Button = forwardRef(({ 
  className, 
  variant = "primary", 
  size = "default", 
  children, 
  ...props 
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98]"
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-green-600 hover:from-green-700 hover:to-green-800 text-white focus:ring-primary shadow-sm hover:shadow-md",
    secondary: "bg-gradient-to-r from-secondary to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white focus:ring-secondary shadow-sm hover:shadow-md",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary",
    ghost: "text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-300",
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-700 hover:to-red-800 text-white focus:ring-red-500 shadow-sm hover:shadow-md"
  }
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    default: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  }
  
  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = "Button"

export default Button