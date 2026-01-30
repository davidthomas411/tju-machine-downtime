'use client'

import { useEffect, useState } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer } from 'lucide-react'

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
        return <Sun className="h-20 w-20 text-amber-500" />
      case 'rainy':
        return <CloudRain className="h-20 w-20 text-blue-500" />
      case 'snowy':
        return <CloudSnow className="h-20 w-20 text-sky-300" />
      default:
        return <Cloud className="h-20 w-20 text-slate-400" />
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading weather...</div>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <p className="text-muted-foreground">{error || 'Weather unavailable'}</p>
      </div>
    )
  }

  return (
    <div className="h-full p-6">
      <h3 className="text-lg font-semibold text-muted-foreground mb-4">
        {weather.location || 'Local Weather'}
      </h3>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {getWeatherIcon(weather.icon)}
          <div>
            <p className="text-5xl font-bold text-foreground">{weather.temp}°F</p>
            <p className="text-lg text-muted-foreground">{weather.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <Thermometer className="h-6 w-6 mx-auto text-orange-500 mb-2" />
          <p className="text-sm text-muted-foreground">Feels Like</p>
          <p className="text-xl font-semibold text-foreground">{weather.feelsLike}°F</p>
        </div>
        
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <Droplets className="h-6 w-6 mx-auto text-blue-500 mb-2" />
          <p className="text-sm text-muted-foreground">Humidity</p>
          <p className="text-xl font-semibold text-foreground">{weather.humidity}%</p>
        </div>
        
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <Wind className="h-6 w-6 mx-auto text-teal-500 mb-2" />
          <p className="text-sm text-muted-foreground">Wind</p>
          <p className="text-xl font-semibold text-foreground">{weather.windSpeed} mph</p>
        </div>
      </div>
    </div>
  )
}
