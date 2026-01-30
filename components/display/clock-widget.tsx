'use client'

interface ClockWidgetProps {
  time?: Date | null
  tone?: 'light' | 'dark'
}

export function ClockWidget({ time, tone = 'light' }: ClockWidgetProps) {
  const primaryText = tone === 'dark' ? 'text-slate-900' : 'text-primary-foreground'
  const mutedText = tone === 'dark' ? 'text-slate-500' : 'text-primary-foreground/70'
  const placeholderText = tone === 'dark' ? 'text-slate-400' : 'text-primary-foreground/40'

  if (!time) {
    return (
      <div className="text-right" aria-hidden="true">
        <p className={`text-3xl font-bold tabular-nums ${placeholderText}`}>--:--</p>
        <p className={`text-sm ${placeholderText}`}>--</p>
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
      <p className={`text-3xl font-bold tabular-nums ${primaryText}`}>{formattedTime}</p>
      <p className={`text-sm ${mutedText}`}>{formattedDate}</p>
    </div>
  )
}
