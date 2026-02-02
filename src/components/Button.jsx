import React from "react";

/**
 * Yhtenäinen nappikomponentti Rascal AI -sovellukseen.
 * Props:
 *  - children: napin sisältö
 *  - onClick: klikattava funktio
 *  - type: button/submit/reset
 *  - disabled: disabloitu vai ei
 *  - variant: 'primary' | 'secondary' | 'danger' (väriteema)
 *  - size: 'sm' | 'md' | 'lg' (koko)
 *  - loading: näytä loading-tila
 *  - fullWidthMobile: täysi leveys mobiilissa
 *  - className: lisäluokat
 */
export default function Button({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidthMobile = false,
  className = "",
  ...rest
}) {
  const baseClasses = "relative inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 overflow-hidden";

  const sizeClasses = {
    sm: "px-4 py-2 text-[10px] rounded-xl",
    md: "px-6 py-3 text-[11px] rounded-2xl",
    lg: "px-10 py-4 text-xs rounded-[20px]",
  };

  const variantClasses = {
    primary: "bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-900/10 hover:shadow-xl hover:shadow-gray-900/20",
    secondary: "bg-white text-gray-900 border border-gray-100 shadow-lg shadow-gray-200/20 hover:bg-gray-50 hover:border-gray-200",
    danger: "bg-red-50 text-red-600 border border-red-100 shadow-lg shadow-red-500/5 hover:bg-red-600 hover:text-white hover:border-red-600",
    success: "bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-lg shadow-emerald-500/5 hover:bg-emerald-600 hover:text-white hover:border-emerald-600",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900",
  };

  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    fullWidthMobile ? "w-full sm:w-auto" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      <span className={loading ? "opacity-50" : ""}>{children}</span>
    </button>
  );
}
