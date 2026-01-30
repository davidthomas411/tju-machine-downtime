'use client'

import { useEffect, useState } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow } from 'lucide-react'

interface WeatherData {
  temp: number
  feelsLike: number
  humidity: number
  windSpeed: number
  description: string
  icon: string
  location?: string
}

interface WeatherWidgetProps {
  tone?: 'light' | 'dark'
  network?: string | null
}

export function WeatherWidget({ tone = 'light', network }: WeatherWidgetProps) {
  const mutedText = tone === 'dark' ? 'text-slate-500' : 'text-primary-foreground/60'
  const pillText = tone === 'dark' ? 'text-slate-700' : 'text-primary-foreground/90'
  const pillBorder = tone === 'dark' ? 'border-slate-200' : 'border-primary-foreground/15'
  const pillBg = tone === 'dark' ? 'bg-white/80' : 'bg-primary-foreground/10'
  const labelMuted = tone === 'dark' ? 'text-slate-500' : 'text-primary-foreground/60'

  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function fetchWeather() {
      try {
        const params = new URLSearchParams()
        if (network) {
          params.set('network', network)
        }
        const response = await fetch(`/api/weather${params.toString() ? `?${params.toString()}` : ''}`, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Weather unavailable')
        }
        const data = await response.json()
        if (mounted) {
          setWeather(data)
          setError('')
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Weather unavailable')
          setLoading(false)
        }
      }
    }

    fetchWeather()

    const interval = setInterval(() => {
      fetchWeather()
    }, 1800000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [network])

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sunny':
        return <Sun className="h-5 w-5 text-amber-300" />
      case 'rainy':
        return <CloudRain className="h-5 w-5 text-sky-200" />
      case 'snowy':
        return <CloudSnow className="h-5 w-5 text-slate-200" />
      default:
        return <Cloud className="h-5 w-5 text-slate-200" />
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-xs ${mutedText}`}>
        <div className={`h-2 w-2 rounded-full ${tone === 'dark' ? 'bg-slate-300' : 'bg-primary-foreground/30'}`} />
        <span>Loading weather</span>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className={`text-xs ${mutedText}`}>
        {error || 'Weather unavailable'}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 rounded-full border ${pillBorder} ${pillBg} px-4 py-2 ${pillText}`}>
      {getWeatherIcon(weather.icon)}
      <div className="flex items-center gap-3">
        <div className="text-lg font-semibold tabular-nums">{weather.temp}°F</div>
        <div className={`text-xs uppercase tracking-[0.2em] ${labelMuted}`}>
          {weather.description}
        </div>
      </div>
      <div className={`hidden lg:flex items-center gap-2 text-[11px] ${labelMuted}`}>
        <span>Feels {weather.feelsLike}°</span>
        <span aria-hidden="true">•</span>
        <span>Humidity {weather.humidity}%</span>
        <span aria-hidden="true">•</span>
        <span>Wind {weather.windSpeed} mph</span>
      </div>
    </div>
  )
}
