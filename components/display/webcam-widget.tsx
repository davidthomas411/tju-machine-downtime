'use client'

import { useState } from 'react'
import { Camera, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

const webcams = [
  {
    id: 1,
    name: 'Independence Mall Live',
    location: 'Fox 29',
    imageUrl: '/brand/maps.jpg',
    externalUrl: 'https://www.fox29.com/independence-mall-panoramic-webcam',
    actionLabel: 'Open Live Webcam',
  },
  {
    id: 2,
    name: 'Philadelphia Live',
    location: 'Fox 29',
    imageUrl: '/brand/maps.jpg',
    externalUrl: 'https://www.fox29.com/philadelphia-webcam',
    actionLabel: 'Open Live Webcam',
  },
  {
    id: 3,
    name: 'TJU Campus Map',
    location: 'Jefferson Health',
    imageUrl: '/brand/maps.jpg',
  },
]

export function WebcamWidget() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentWebcam = webcams[currentIndex]

  function goToPrevious() {
    setCurrentIndex((prev) => (prev === 0 ? webcams.length - 1 : prev - 1))
  }

  function goToNext() {
    setCurrentIndex((prev) => (prev === webcams.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">City Views</h3>
        </div>
      </div>

      <div className="flex-1 relative">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-500"
          style={{ backgroundImage: `url(${currentWebcam.imageUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 text-card">
          <p className="font-semibold text-lg">{currentWebcam.name}</p>
          <p className="text-sm text-card/80">{currentWebcam.location}</p>
        </div>

        {currentWebcam.externalUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              asChild
              variant="secondary"
              className="bg-black/60 text-card hover:bg-black/70"
            >
              <a href={currentWebcam.externalUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                {currentWebcam.actionLabel || 'Open Live View'}
              </a>
            </Button>
          </div>
        )}

        <div className="absolute inset-y-0 left-0 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="ml-2 bg-black/30 text-card hover:bg-black/50 hover:text-card"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="mr-2 bg-black/30 text-card hover:bg-black/50 hover:text-card"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="p-3 flex justify-center gap-2 bg-muted/30">
        {webcams.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
            aria-label={`View webcam ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
