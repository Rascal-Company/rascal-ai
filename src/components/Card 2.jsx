import React from "react";

/**
 * Yhtenäinen korttikomponentti Rascal AI -sovellukseen.
 * Props:
 *  - children: kortin sisältö
 *  - variant: 'default' | 'elevated' | 'outlined' | 'ghost'
 *  - padding: 'none' | 'sm' | 'md' | 'lg'
 *  - hover: lisää hover-efekti
 *  - onClick: klikattava kortti
 *  - className: lisäluokat
 */
export default function Card({
  children,
  variant = "default",
  padding = "md",
  hover = false,
  onClick,
  className = "",
  ...rest
}) {
  const variantClasses = {
    default: "card",
    elevated: "card card-elevated",
    outlined: "card card-outlined",
    ghost: "card card-ghost",
  };

  const paddingClasses = {
    none: "card-p-none",
    sm: "card-p-sm",
    md: "",
    lg: "card-p-lg",
  };

  const classes = [
    variantClasses[variant] || "card",
    paddingClasses[padding] || "",
    hover ? "card-hover" : "",
    onClick ? "card-clickable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Card Header
 */
export function CardHeader({ children, className = "", actions }) {
  return (
    <div className={`card-header ${className}`}>
      <div className="card-header-content">{children}</div>
      {actions && <div className="card-header-actions">{actions}</div>}
    </div>
  );
}

/**
 * Card Title
 */
export function CardTitle({ children, className = "" }) {
  return <h3 className={`card-title ${className}`}>{children}</h3>;
}

/**
 * Card Description
 */
export function CardDescription({ children, className = "" }) {
  return <p className={`card-description ${className}`}>{children}</p>;
}

/**
 * Card Content
 */
export function CardContent({ children, className = "" }) {
  return <div className={`card-content ${className}`}>{children}</div>;
}

/**
 * Card Footer
 */
export function CardFooter({ children, className = "" }) {
  return <div className={`card-footer ${className}`}>{children}</div>;
}
