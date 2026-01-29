'use client'

import { Megaphone, Calendar, AlertCircle, Info } from 'lucide-react'
import type { Site } from '@/lib/types'

interface AnnouncementWidgetProps {
  site: Site | null
}

// In production, these would come from the database
const announcements = [
  {
    id: 1,
    type: 'info',
    title: 'Department Meeting',
    message: 'Weekly staff meeting at 8:00 AM in Conference Room B',
    date: 'Today',
  },
  {
    id: 2,
    type: 'alert',
    title: 'System Maintenance',
    message: 'Scheduled maintenance this Saturday 2:00 AM - 6:00 AM',
    date: 'Jan 31',
  },
  {
    id: 3,
    type: 'info',
    title: 'Training Session',
    message: 'New LINAC software training available next week',
    date: 'Feb 3',
  },
]

export function AnnouncementWidget({ site }: AnnouncementWidgetProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-status-delayed" />
      default:
        return <Info className="h-5 w-5 text-primary" />
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Announcements</h3>
        </div>
        {site && (
          <p className="text-sm text-muted-foreground mt-1">{site.name}</p>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="p-4 bg-muted/50 rounded-xl border border-border"
          >
            <div className="flex items-start gap-3">
              {getIcon(announcement.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium text-foreground truncate">
                    {announcement.title}
                  </h4>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                    <Calendar className="h-3 w-3" />
                    {announcement.date}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {announcement.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border bg-muted/30">
        <p className="text-xs text-center text-muted-foreground">
          Contact your administrator to add announcements
        </p>
      </div>
    </div>
  )
}
