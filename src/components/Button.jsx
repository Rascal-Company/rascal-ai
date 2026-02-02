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
  const sizeClasses = {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
  };

  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    danger: "btn-danger",
  };

  const classes = [
    "btn",
    variantClasses[variant] || "btn-primary",
    sizeClasses[size] || "",
    loading ? "btn-loading" : "",
    fullWidthMobile ? "btn-full-mobile" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      {...rest}
    >
      {children}
    </button>
  );
}
