'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CheckCircle, Clock, AlertTriangle, XCircle, Wrench, Loader2, Edit } from 'lucide-react'
import type { Machine, MachineStatusRecord, MachineStatus } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/types'
import { updateMachineStatus } from '@/lib/actions/machines'

interface MachineStatusCardProps {
  machine: Machine & { currentStatus: MachineStatusRecord | null }
  canEdit?: boolean
  compact?: boolean
  disableAnimations?: boolean
}

const statusIcons: Record<string, React.ReactNode> = {
  'check-circle': <CheckCircle className="h-6 w-6" />,
  'clock': <Clock className="h-6 w-6" />,
  'alert-triangle': <AlertTriangle className="h-6 w-6" />,
  'x-circle': <XCircle className="h-6 w-6" />,
  'wrench': <Wrench className="h-6 w-6" />,
}

export function MachineStatusCard({
  machine,
  canEdit = false,
  compact = false,
  disableAnimations = false,
}: MachineStatusCardProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<MachineStatus>(
    machine.currentStatus?.status || 'on_time'
  )
  const [notes, setNotes] = useState(machine.currentStatus?.notes || '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const animationClass = disableAnimations ? '' : 'animate-slide-in'
  const glowClass = disableAnimations ? '' : 'animate-pulse-glow'

  const currentStatus = machine.currentStatus?.status || 'on_time'
  const config = STATUS_CONFIG[currentStatus]

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    const result = await updateMachineStatus(machine.id, selectedStatus, notes)
    if (result?.error) {
      setSaveError(result.error)
      setSaving(false)
      return
    }
    setSaving(false)
    setDialogOpen(false)
    router.refresh()
  }

  const statusColorClasses: Record<MachineStatus, string> = {
    on_time: 'border-status-on-time bg-status-on-time/10',
    delayed_5min: 'border-status-delayed bg-status-delayed/10',
    delayed_10min: 'border-status-delayed bg-status-delayed/10',
    delayed_15min: 'border-status-delayed bg-status-delayed/10',
    delayed_30min: 'border-status-delayed bg-status-delayed/10',
    delayed_60min: 'border-status-delayed bg-status-delayed/10',
    down_temporary: 'border-status-down bg-status-down/10',
    down_day: 'border-status-down bg-status-down/10',
    maintenance: 'border-muted-foreground bg-muted',
  }

  const statusOptions: MachineStatus[] = [
    'on_time',
    'delayed_10min',
    'delayed_15min',
    'delayed_30min',
    'delayed_60min',
    'down_temporary',
    'down_day',
    'maintenance',
  ]

  if (compact) {
    return (
      <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${statusColorClasses[currentStatus]} ${animationClass}`}>
        <div className="flex items-center gap-3">
          <div className={config.color}>
            {statusIcons[config.icon]}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{machine.name}</h3>
            <p className="text-sm text-muted-foreground">{machine.location}</p>
          </div>
        </div>
        <Badge variant="outline" className={`${config.color} border-current`}>
          {config.label}
        </Badge>
      </div>
    )
  }

  return (
    <Card className={`border-2 ${statusColorClasses[currentStatus]} transition-all duration-300 hover:shadow-lg ${animationClass}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">{machine.name}</CardTitle>
            {machine.model && (
              <p className="text-sm text-muted-foreground">{machine.model}</p>
            )}
          </div>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="bg-transparent hover:bg-foreground/10">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Update {machine.name} Status</DialogTitle>
                  <DialogDescription>
                    Select the current status for this LINAC machine.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {saveError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      {saveError}
                    </div>
                  )}
                  <RadioGroup value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as MachineStatus)}>
                    <div className="grid gap-2">
                      {statusOptions.map((status) => {
                        const cfg = STATUS_CONFIG[status]
                        return (
                        <div key={status} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted">
                          <RadioGroupItem value={status} id={status} />
                          <Label htmlFor={status} className="flex items-center gap-2 cursor-pointer flex-1">
                            <span className={cfg.color}>{statusIcons[cfg.icon]}</span>
                            <span>{cfg.label}</span>
                          </Label>
                        </div>
                        )
                      })}
                    </div>
                  </RadioGroup>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any additional information..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Status
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${config.bgColor} text-card ${glowClass}`} style={{ color: 'inherit' }}>
            <span className="text-card">{statusIcons[config.icon]}</span>
          </div>
          <div className="flex-1">
            <p className={`text-2xl font-bold ${config.color}`}>{config.label}</p>
            {machine.location && (
              <p className="text-sm text-muted-foreground">Room: {machine.location}</p>
            )}
          </div>
        </div>
        
        {machine.currentStatus?.notes && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">{machine.currentStatus.notes}</p>
          </div>
        )}
        
        {machine.currentStatus?.updated_at && (
          <p className="mt-3 text-xs text-muted-foreground">
            Last updated: {new Date(machine.currentStatus.updated_at).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
