export type MachineStatus =
  | 'on_time'
  | 'delayed_5min'
  | 'delayed_10min'
  | 'delayed_15min'
  | 'delayed_30min'
  | 'delayed_60min'
  | 'down_temporary'
  | 'down_day'
  | 'maintenance'

export interface Site {
  id: string
  name: string
  code: string
  address: string | null
  network?: string | null
  created_at: string
}

export interface Machine {
  id: string
  site_id: string
  name: string
  model: string | null
  location: string | null
  display_order: number
  is_active: boolean
  created_at: string
  site?: Site
}

export interface MachineStatusRecord {
  id: string
  machine_id: string
  status: MachineStatus
  notes: string | null
  updated_by: string
  updated_at: string
  machine?: Machine
  profiles?: Profile
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'staff' | 'viewer'
  site_id: string | null
  created_at: string
  site?: Site
}

export interface Widget {
  id: string
  site_id: string
  type: 'weather' | 'webcam' | 'announcement' | 'clock'
  title: string
  config: Record<string, unknown>
  display_order: number
  is_active: boolean
  created_at: string
}

export interface SiteSettings {
  id: string
  site_id: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  rotation_interval: number
  display_mode: 'grid' | 'list' | 'carousel'
  created_at: string
}

export const STATUS_CONFIG: Record<MachineStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  on_time: { label: 'On Time', color: 'text-status-on-time', bgColor: 'bg-status-on-time', icon: 'check-circle' },
  delayed_5min: { label: '5 Min Delay', color: 'text-status-delayed', bgColor: 'bg-status-delayed', icon: 'clock' },
  delayed_10min: { label: '10 Min Delay', color: 'text-status-delayed', bgColor: 'bg-status-delayed', icon: 'clock' },
  delayed_15min: { label: '15 Min Delay', color: 'text-status-delayed', bgColor: 'bg-status-delayed', icon: 'clock' },
  delayed_30min: { label: '30 Min Delay', color: 'text-status-delayed', bgColor: 'bg-status-delayed', icon: 'clock' },
  delayed_60min: { label: '1 Hr Delay', color: 'text-status-delayed', bgColor: 'bg-status-delayed', icon: 'clock' },
  down_temporary: { label: 'Temporarily Down', color: 'text-status-down', bgColor: 'bg-status-down', icon: 'alert-triangle' },
  down_day: { label: 'Down for Day', color: 'text-status-down', bgColor: 'bg-status-down', icon: 'x-circle' },
  maintenance: { label: 'Maintenance', color: 'text-muted-foreground', bgColor: 'bg-muted', icon: 'wrench' },
}
