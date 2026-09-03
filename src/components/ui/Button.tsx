"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none";

    const variants = {
      primary:
        "bg-[#1e3a5f] text-white hover:bg-[#163050] focus-visible:ring-[#1e3a5f] active:scale-95",
      secondary:
        "bg-[#2563eb] text-white hover:bg-[#1d4ed8] focus-visible:ring-[#2563eb] active:scale-95",
      danger:
        "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 active:scale-95",
      ghost:
        "bg-transparent text-[#1e3a5f] hover:bg-[#1e3a5f]/10 focus-visible:ring-[#1e3a5f]",
      outline:
        "bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f]/5 focus-visible:ring-[#1e3a5f] active:scale-95",
      success:
        "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600 active:scale-95",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-5 py-2.5 text-sm gap-2",
      lg: "px-7 py-3.5 text-base gap-2",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
