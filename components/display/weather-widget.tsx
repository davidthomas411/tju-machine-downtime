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

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function fetchWeather() {
      try {
        const response = await fetch('/api/weather', { cache: 'no-store' })
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
  }, [])

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
      <div className="flex items-center gap-2 text-xs text-primary-foreground/60">
        <div className="h-2 w-2 rounded-full bg-primary-foreground/30" />
        <span>Loading weather</span>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="text-xs text-primary-foreground/60">
        {error || 'Weather unavailable'}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-2 text-primary-foreground/90">
      {getWeatherIcon(weather.icon)}
      <div className="flex items-center gap-3">
        <div className="text-lg font-semibold tabular-nums">{weather.temp}°F</div>
        <div className="text-xs uppercase tracking-[0.2em] text-primary-foreground/60">
          {weather.description}
        </div>
      </div>
      <div className="hidden lg:flex items-center gap-2 text-[11px] text-primary-foreground/60">
        <span>Feels {weather.feelsLike}°</span>
        <span aria-hidden="true">•</span>
        <span>Humidity {weather.humidity}%</span>
        <span aria-hidden="true">•</span>
        <span>Wind {weather.windSpeed} mph</span>
      </div>
    </div>
  )
}
