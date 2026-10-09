"use client";

import { Children, cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactElement } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
 variant?:"default" |"outline" |"ghost";
 size?:"default" |"sm" |"icon";
 asChild?: boolean;
};

export function Button({
 className ="",
 variant ="default",
 size ="default",
 asChild = false,
 children,
 ...props
}: ButtonProps) {
 const variantClasses =
 variant ==="outline"
 ?"border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
 : variant ==="ghost"
 ?"bg-transparent text-[var(--text-secondary)] hover:bg-[var(--btn-secondary-hover)]"
 :"bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]";
 const sizeClasses =
 size ==="icon" ?"h-9 w-9 p-0" : size ==="sm" ?"h-8 px-3 text-sm" :"h-10 px-4 text-sm";
 const combinedClassName =
 `inline-flex items-center justify-center rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses} ${sizeClasses} ${className}`.trim();

 if (asChild) {
 const child = Children.only(children);
 if (!isValidElement(child)) return null;
 const childElement = child as ReactElement<{ className?: string }>;
 const childClassName = childElement.props.className ??"";
 return cloneElement(childElement, {
 ...props,
 className: `${combinedClassName} ${childClassName}`.trim(),
 });
 }

 return (
 <button
 className={combinedClassName}
 {...props}
 >
 {children}
 </button>
 );
}
