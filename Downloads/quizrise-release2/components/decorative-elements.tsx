"use client"

interface CircleElementProps {
  size: number
  color: string
  className?: string
}

export function CircleElement({ size, color, className = "" }: CircleElementProps) {
  return (
    <div
      className={`rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
    />
  )
}

interface DotsGridProps {
  className?: string
}

export function DotsGrid({ className = "" }: DotsGridProps) {
  return (
    <svg className={className} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="2" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  )
}

interface WaveElementProps {
  className?: string
}

export function WaveElement({ className = "" }: WaveElementProps) {
  return (
    <svg className={className} viewBox="0 0 1200 120" preserveAspectRatio="none" fill="currentColor">
      <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" />
    </svg>
  )
}

interface FloatingShapesProps {
  count: number
  baseSize: number
  colors: string[]
  className?: string
}

export function FloatingShapes({ count, baseSize, colors, className = "" }: FloatingShapesProps) {
  return (
    <div className={`relative ${className}`}>
      {Array.from({ length: count }).map((_, index) => {
        const size = baseSize + Math.random() * 20
        const color = colors[index % colors.length]
        const x = Math.random() * 200
        const y = Math.random() * 200
        const rotation = Math.random() * 360

        return (
          <div
            key={index}
            className="absolute rounded-full animate-pulse"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              left: x,
              top: y,
              transform: `rotate(${rotation}deg)`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        )
      })}
    </div>
  )
}

interface GradientBlobProps {
  width: number
  height: number
  colors: string[]
  className?: string
}

export function GradientBlob({ width, height, colors, className = "" }: GradientBlobProps) {
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1] || colors[0]} />
        </radialGradient>
      </defs>
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2}
        ry={height / 2}
        fill={`url(#${gradientId})`}
        className="animate-pulse"
        style={{
          animationDuration: "4s",
        }}
      />
    </svg>
  )
}
