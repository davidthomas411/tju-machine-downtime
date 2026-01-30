'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import type { Site } from '@/lib/types'
import { createSite, updateSite, deleteSite } from '@/lib/actions/sites'

interface SitesManagerProps {
  sites: Site[]
}

export function SitesManager({ sites }: SitesManagerProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState('tju')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [networkFilter, setNetworkFilter] = useState('all')
  const [sortKey, setSortKey] = useState('name-asc')

  const filteredSites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    let result = sites.filter((site) => {
      if (!normalizedQuery) return true
      const haystack = [site.name, site.code, site.address]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    })

    if (networkFilter !== 'all') {
      result = result.filter((site) => (site.network || 'tju') === networkFilter)
    }

    const sorted = [...result]
    sorted.sort((a, b) => {
      const aCode = a.code || ''
      const bCode = b.code || ''
      switch (sortKey) {
        case 'name-desc':
          return a.name.localeCompare(b.name) * -1
        case 'code':
          return aCode.localeCompare(bCode)
        case 'network':
          return (a.network || 'tju').localeCompare(b.network || 'tju')
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return sorted
  }, [sites, query, networkFilter, sortKey])

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    formData.set('network', selectedNetwork)
    
    if (editingSite) {
      await updateSite(editingSite.id, formData)
    } else {
      await createSite(formData)
    }
    
    setSaving(false)
    setDialogOpen(false)
    setEditingSite(null)
    router.refresh()
  }

  async function handleDelete(siteId: string) {
    if (!confirm('Are you sure you want to delete this site? All associated machines will also be deleted.')) {
      return
    }
    
    setDeleting(siteId)
    await deleteSite(siteId)
    setDeleting(null)
    router.refresh()
  }

  function openEditDialog(site: Site) {
    setEditingSite(site)
    setSelectedNetwork(site.network || 'tju')
    setDialogOpen(true)
  }

  function openNewDialog() {
    setEditingSite(null)
    setSelectedNetwork('tju')
    setDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Enterprise Sites</CardTitle>
            <CardDescription>Manage hospital locations and departments</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} className="bg-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add Site
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form action={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingSite ? 'Edit Site' : 'Add New Site'}</DialogTitle>
                  <DialogDescription>
                    {editingSite ? 'Update the site information.' : 'Add a new hospital location or department.'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Site Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Jefferson Hospital - Main Campus"
                      defaultValue={editingSite?.name || ''}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code">Site Code</Label>
                    <Input
                      id="code"
                      name="code"
                      placeholder="JH-MAIN"
                      defaultValue={editingSite?.code || ''}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address (optional)</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="111 S 11th St, Philadelphia, PA 19107"
                      defaultValue={editingSite?.address || ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="network">Network</Label>
                    <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                      <SelectTrigger id="network">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tju">Jefferson Health (TJU)</SelectItem>
                        <SelectItem value="lvhn">Lehigh Valley Health Network</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground">
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {editingSite ? 'Save Changes' : 'Add Site'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Search sites"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-56"
          />
          <Select value={networkFilter} onValueChange={setNetworkFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All networks</SelectItem>
              <SelectItem value="tju">Jefferson Health (TJU)</SelectItem>
              <SelectItem value="lvhn">Lehigh Valley Health Network</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="network">Network</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSites.map((site) => (
              <TableRow key={site.id}>
                <TableCell className="font-medium">{site.name}</TableCell>
                <TableCell>{site.code || '-'}</TableCell>
                <TableCell className="text-muted-foreground capitalize">
                  {site.network || 'tju'}
                </TableCell>
                <TableCell className="text-muted-foreground">{site.address || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(site)}
                      className="bg-transparent"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(site.id)}
                      disabled={deleting === site.id}
                      className="text-destructive hover:text-destructive bg-transparent"
                    >
                      {deleting === site.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredSites.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No sites configured. Add your first site to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
