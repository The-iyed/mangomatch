"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { useScrollPosition } from "@/hooks/use-scroll-position"

interface ParallaxElementProps {
  children: ReactNode
  speed?: number
  className?: string
}

export function ParallaxElement({ children, speed = 0.5, className = "" }: ParallaxElementProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const scrollY = useScrollPosition()

  useEffect(() => {
    if (!elementRef.current) return

    const element = elementRef.current
    const rect = element.getBoundingClientRect()
    const elementTop = rect.top + window.pageYOffset
    const elementHeight = rect.height
    const windowHeight = window.innerHeight

    // Calculate if element is in viewport
    const isInViewport = scrollY + windowHeight > elementTop && scrollY < elementTop + elementHeight

    if (isInViewport) {
      const yPos = -(scrollY - elementTop) * speed
      element.style.transform = `translate3d(0, ${yPos}px, 0)`
    }
  }, [scrollY, speed])

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        willChange: "transform",
      }}
    >
      {children}
    </div>
  )
}
