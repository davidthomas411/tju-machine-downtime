import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const DEFAULT_LAT = 39.9526
const DEFAULT_LON = -75.1652
const DEFAULT_LOCATION = 'Philadelphia, PA'
const LVHN_DEFAULT_LAT = 40.6084
const LVHN_DEFAULT_LON = -75.4902
const LVHN_DEFAULT_LOCATION = 'Allentown, PA'

type WeatherIcon = 'sunny' | 'partly-cloudy' | 'rainy' | 'snowy'

function mapWeather(code: number): { description: string; icon: WeatherIcon } {
  if (code === 0) return { description: 'Clear', icon: 'sunny' }
  if (code === 1) return { description: 'Mostly Clear', icon: 'partly-cloudy' }
  if (code === 2) return { description: 'Partly Cloudy', icon: 'partly-cloudy' }
  if (code === 3) return { description: 'Overcast', icon: 'partly-cloudy' }
  if (code === 45 || code === 48) return { description: 'Fog', icon: 'partly-cloudy' }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { description: 'Snow', icon: 'snowy' }
  }

  if ([95, 96, 99].includes(code)) {
    return { description: 'Thunderstorm', icon: 'rainy' }
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { description: 'Rain', icon: 'rainy' }
  }

  return { description: 'Mixed', icon: 'partly-cloudy' }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const network = (url.searchParams.get('network') || '').toLowerCase()
  const latParam = url.searchParams.get('lat')
  const lonParam = url.searchParams.get('lon')
  const locationParam = url.searchParams.get('location')

  let latitude = Number(process.env.WEATHER_LAT ?? DEFAULT_LAT)
  let longitude = Number(process.env.WEATHER_LON ?? DEFAULT_LON)
  let location = process.env.WEATHER_LOCATION_NAME || DEFAULT_LOCATION

  if (network === 'lvhn') {
    latitude = Number(process.env.WEATHER_LVHN_LAT ?? LVHN_DEFAULT_LAT)
    longitude = Number(process.env.WEATHER_LVHN_LON ?? LVHN_DEFAULT_LON)
    location = process.env.WEATHER_LVHN_LOCATION_NAME || LVHN_DEFAULT_LOCATION
  }

  if (latParam && lonParam && Number.isFinite(Number(latParam)) && Number.isFinite(Number(lonParam))) {
    latitude = Number(latParam)
    longitude = Number(lonParam)
  }

  if (locationParam) {
    location = locationParam
  }

  const apiUrl = new URL('https://api.open-meteo.com/v1/forecast')
  apiUrl.searchParams.set('latitude', latitude.toString())
  apiUrl.searchParams.set('longitude', longitude.toString())
  apiUrl.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
  )
  apiUrl.searchParams.set('temperature_unit', 'fahrenheit')
  apiUrl.searchParams.set('wind_speed_unit', 'mph')
  apiUrl.searchParams.set('timezone', 'auto')

  const response = await fetch(apiUrl, { next: { revalidate: 900 } })
  if (!response.ok) {
    return NextResponse.json({ error: 'Weather unavailable' }, { status: 502 })
  }

  const payload = await response.json()
  const current = payload.current

  if (!current) {
    return NextResponse.json({ error: 'Weather unavailable' }, { status: 502 })
  }

  const { description, icon } = mapWeather(current.weather_code)

  return NextResponse.json({
    location,
    temp: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: Math.round(current.relative_humidity_2m),
    windSpeed: Math.round(current.wind_speed_10m),
    description,
    icon,
    updatedAt: current.time,
  })
}
