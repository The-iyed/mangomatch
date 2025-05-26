"use client"

import type { ReactNode } from "react"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"
import { cn } from "@/lib/utils"

type AnimationType = "fade-up" | "fade-in" | "slide-left" | "slide-right" | "zoom-in" | "bounce"

interface ScrollRevealProps {
  children: ReactNode
  animation?: AnimationType
  delay?: number
  duration?: number
  threshold?: number
  className?: string
  rootMargin?: string
  triggerOnce?: boolean
}

export function ScrollReveal({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 600,
  threshold = 0.1,
  className,
  rootMargin = "0px",
  triggerOnce = true,
}: ScrollRevealProps) {
  const [isIntersecting, ref] = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce,
  })

  const animationClasses = {
    "fade-up": "translate-y-10 opacity-0",
    "fade-in": "opacity-0",
    "slide-left": "-translate-x-10 opacity-0",
    "slide-right": "translate-x-10 opacity-0",
    "zoom-in": "scale-95 opacity-0",
    bounce: "translate-y-4 opacity-0",
  }

  const activeAnimationClasses = {
    "fade-up": "translate-y-0 opacity-100",
    "fade-in": "opacity-100",
    "slide-left": "translate-x-0 opacity-100",
    "slide-right": "translate-x-0 opacity-100",
    "zoom-in": "scale-100 opacity-100",
    bounce: "translate-y-0 opacity-100 animate-bounce",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all",
        animationClasses[animation],
        isIntersecting && activeAnimationClasses[animation],
        className,
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
