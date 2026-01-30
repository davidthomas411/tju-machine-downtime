'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import type { Site, Machine } from '@/lib/types'
import { createMachine, updateMachine, deleteMachine } from '@/lib/actions/machines'

interface MachinesManagerProps {
  machines: (Machine & { site: Site | null })[]
  sites: Site[]
}

export function MachinesManager({ machines, sites }: MachinesManagerProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null)
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [query, setQuery] = useState('')
  const [siteFilter, setSiteFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState('name-asc')

  const filteredMachines = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    let result = machines.filter((machine) => {
      if (!normalizedQuery) return true
      const haystack = [
        machine.name,
        machine.model,
        machine.location,
        machine.site?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    })

    if (siteFilter !== 'all') {
      result = result.filter((machine) => machine.site_id === siteFilter)
    }

    if (statusFilter !== 'all') {
      const isActiveFilter = statusFilter === 'active'
      result = result.filter((machine) => machine.is_active === isActiveFilter)
    }

    const sorted = [...result]
    sorted.sort((a, b) => {
      switch (sortKey) {
        case 'name-desc':
          return a.name.localeCompare(b.name) * -1
        case 'site':
          return (a.site?.name || '').localeCompare(b.site?.name || '')
        case 'order':
          return (a.display_order || 0) - (b.display_order || 0)
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return sorted
  }, [machines, query, siteFilter, statusFilter, sortKey])

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    setFormError('')
    formData.set('site_id', selectedSiteId)
    formData.set('is_active', isActive.toString())
    
    if (editingMachine) {
      const result = await updateMachine(editingMachine.id, formData)
      if (result?.error) {
        setFormError(result.error)
        setSaving(false)
        return
      }
    } else {
      const result = await createMachine(formData)
      if (result?.error) {
        setFormError(result.error)
        setSaving(false)
        return
      }
    }
    
    setSaving(false)
    setDialogOpen(false)
    setEditingMachine(null)
    router.refresh()
  }

  async function handleDelete(machineId: string) {
    if (!confirm('Are you sure you want to delete this machine?')) {
      return
    }
    
    setDeleting(machineId)
    await deleteMachine(machineId)
    setDeleting(null)
    router.refresh()
  }

  function openEditDialog(machine: Machine) {
    setEditingMachine(machine)
    setSelectedSiteId(machine.site_id)
    setIsActive(machine.is_active)
    setDialogOpen(true)
  }

  function openNewDialog() {
    setEditingMachine(null)
    setSelectedSiteId(sites[0]?.id || '')
    setIsActive(true)
    setDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>LINAC Machines</CardTitle>
            <CardDescription>Configure treatment machines for each site</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} disabled={sites.length === 0} className="bg-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add Machine
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form action={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingMachine ? 'Edit Machine' : 'Add New Machine'}</DialogTitle>
                  <DialogDescription>
                    {editingMachine ? 'Update the machine configuration.' : 'Add a new LINAC machine to a site.'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {formError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {formError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="site">Site</Label>
                    <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a site" />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Machine Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="TrueBeam 1"
                      defaultValue={editingMachine?.name || ''}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="model">Model (optional)</Label>
                    <Input
                      id="model"
                      name="model"
                      placeholder="Varian TrueBeam"
                      defaultValue={editingMachine?.model || ''}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Room/Location (optional)</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="Room 101"
                      defaultValue={editingMachine?.location || ''}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      name="display_order"
                      type="number"
                      placeholder="1"
                      defaultValue={editingMachine?.display_order || 0}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Active</Label>
                    <Switch
                      id="is_active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving || !selectedSiteId} className="bg-primary text-primary-foreground">
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {editingMachine ? 'Save Changes' : 'Add Machine'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {sites.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            <Input
              placeholder="Search machines"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-56"
            />
            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Filter by site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sites</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={setSortKey}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="site">Site</SelectItem>
                <SelectItem value="order">Display Order</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {sites.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Add a site first before adding machines.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMachines.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell className="font-medium">{machine.name}</TableCell>
                  <TableCell className="text-muted-foreground">{machine.model || '-'}</TableCell>
                  <TableCell>{machine.site?.name || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{machine.location || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={machine.is_active ? 'default' : 'secondary'}>
                      {machine.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(machine)}
                        className="bg-transparent"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(machine.id)}
                        disabled={deleting === machine.id}
                        className="text-destructive hover:text-destructive bg-transparent"
                      >
                        {deleting === machine.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredMachines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No machines configured. Add your first LINAC machine to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
