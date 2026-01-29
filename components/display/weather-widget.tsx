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
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate weather data for Philadelphia
    // In production, you would fetch from a weather API
    const mockWeather: WeatherData = {
      temp: 45,
      feelsLike: 42,
      humidity: 65,
      windSpeed: 12,
      description: 'Partly Cloudy',
      icon: 'partly-cloudy',
    }
    
    setTimeout(() => {
      setWeather(mockWeather)
      setLoading(false)
    }, 500)

    // Refresh weather every 30 minutes
    const interval = setInterval(() => {
      // Simulate small variations
      setWeather(prev => prev ? {
        ...prev,
        temp: prev.temp + Math.floor(Math.random() * 3) - 1,
        humidity: Math.min(100, Math.max(0, prev.humidity + Math.floor(Math.random() * 5) - 2)),
      } : null)
    }, 1800000)

    return () => clearInterval(interval)
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

  if (!weather) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <p className="text-muted-foreground">Weather unavailable</p>
      </div>
    )
  }

  return (
    <div className="h-full p-6">
      <h3 className="text-lg font-semibold text-muted-foreground mb-4">Philadelphia Weather</h3>
      
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
