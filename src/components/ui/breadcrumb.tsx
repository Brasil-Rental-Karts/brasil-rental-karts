import * as React from "react"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

import { cn } from "@/lib/utils"

// Tipos
interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  className?: string
}

interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode
  className?: string
  active?: boolean
  asChild?: boolean
  href?: string
}

interface BreadcrumbLinkProps {
  children: React.ReactNode
  className?: string
  asChild?: boolean
  href: string
}

interface BreadcrumbSeparatorProps extends React.HTMLAttributes<HTMLLIElement> {
  children?: React.ReactNode
  className?: string
}

interface BreadcrumbHomeProps extends React.HTMLAttributes<HTMLLIElement> {
  className?: string
  href?: string
}

// Componentes
const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, children, ...props }, ref) => (
    <nav ref={ref} aria-label="Breadcrumb" className={cn("flex", className)} {...props}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {children}
      </ol>
    </nav>
  )
)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, children, active, asChild, href, ...props }, ref) => {
    if (asChild) {
      return (
        <li
          ref={ref}
          className={cn(
            "inline-flex items-center text-sm font-medium",
            active ? "text-foreground" : "text-muted-foreground hover:text-foreground/80",
            className
          )}
          aria-current={active ? "page" : undefined}
          {...props}
        >
          {children}
        </li>
      )
    }
    
    return (
      <li
        ref={ref}
        className={cn(
          "inline-flex items-center text-sm font-medium",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground/80",
          className
        )}
        aria-current={active ? "page" : undefined}
        {...props}
      >
        {href ? (
          <Link href={href} className="hover:underline">
            {children}
          </Link>
        ) : (
          children
        )}
      </li>
    )
  }
)
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = ({ className, asChild = false, children, href }: BreadcrumbLinkProps) => {
  if (asChild) {
    return <span className={className}>{children}</span>
  }
  
  return (
    <Link
      href={href}
      className={cn("transition-colors hover:text-foreground hover:underline", className)}
    >
      {children}
    </Link>
  )
}
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbSeparator = React.forwardRef<HTMLLIElement, BreadcrumbSeparatorProps>(
  ({ className, children, ...props }, ref) => (
    <li ref={ref} className={cn("text-muted-foreground/60", className)} {...props}>
      <span className="mx-1">{children || <ChevronRight className="h-3 w-3" />}</span>
    </li>
  )
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbHome = React.forwardRef<HTMLLIElement, BreadcrumbHomeProps>(
  ({ className, href = "/", ...props }, ref) => (
    <li ref={ref} className={cn("inline-flex items-center", className)} {...props}>
      <Link 
        href={href} 
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Início"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
    </li>
  )
)
BreadcrumbHome.displayName = "BreadcrumbHome"

export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbHome
} 