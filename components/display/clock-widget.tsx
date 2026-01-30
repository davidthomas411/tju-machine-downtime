'use client'

interface ClockWidgetProps {
  time?: Date | null
}

export function ClockWidget({ time }: ClockWidgetProps) {
  if (!time) {
    return (
      <div className="text-right" aria-hidden="true">
        <p className="text-3xl font-bold tabular-nums text-primary-foreground/40">--:--</p>
        <p className="text-sm text-primary-foreground/40">--</p>
      </div>
    )
  }

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="text-right">
      <p className="text-3xl font-bold tabular-nums">{formattedTime}</p>
      <p className="text-sm text-primary-foreground/70">{formattedDate}</p>
    </div>
  )
}
