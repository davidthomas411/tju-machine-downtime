'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
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
import type { Site, Profile } from '@/lib/types'
import { toDisplayUsername } from '@/lib/auth/username'
import { updateUserSite } from '@/lib/actions/users'

interface UsersManagerProps {
  users: (Profile & { site: Site | null })[]
  sites: Site[]
}

const roleBadgeVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  staff: 'secondary',
  viewer: 'outline',
}

export function UsersManager({ users, sites }: UsersManagerProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [siteFilter, setSiteFilter] = useState('all')
  const [sortKey, setSortKey] = useState('name-asc')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const siteOptions = useMemo(() => sites, [sites])

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    let result = users.filter((user) => {
      if (!normalizedQuery) return true
      const haystack = [
        user.full_name,
        user.email,
        toDisplayUsername(user.email),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    })

    if (roleFilter !== 'all') {
      result = result.filter((user) => user.role === roleFilter)
    }

    if (siteFilter !== 'all') {
      result = result.filter((user) => user.site_id === siteFilter)
    }

    const sorted = [...result]
    sorted.sort((a, b) => {
      switch (sortKey) {
        case 'name-desc':
          return (b.full_name || b.email || '').localeCompare(a.full_name || a.email || '')
        case 'role':
          return a.role.localeCompare(b.role)
        case 'joined':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'name-asc':
        default:
          return (a.full_name || a.email || '').localeCompare(b.full_name || b.email || '')
      }
    })

    return sorted
  }, [users, query, roleFilter, siteFilter, sortKey])

  async function handleSiteUpdate(userId: string, siteId: string | null) {
    setUpdatingUserId(userId)
    await updateUserSite(userId, siteId)
    setUpdatingUserId(null)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          View registered users and their access levels. Users are created automatically on Supabase signup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Search users"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-56"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sites</SelectItem>
              {siteOptions.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="role">Role</SelectItem>
              <SelectItem value="joined">Newest Joined</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.full_name || toDisplayUsername(user.email) || 'Unknown'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {toDisplayUsername(user.email) || user.email}
                </TableCell>
                <TableCell>
                  <Badge variant={roleBadgeVariants[user.role] || 'outline'} className="capitalize">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Select
                      value={user.site_id || 'all'}
                      onValueChange={(value) => handleSiteUpdate(user.id, value === 'all' ? null : value)}
                      disabled={updatingUserId === user.id}
                    >
                    <SelectTrigger className="h-8 w-56">
                      <SelectValue placeholder="All Sites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sites</SelectItem>
                      {siteOptions.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    {updatingUserId === user.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No users registered yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Role Descriptions</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><strong>Admin:</strong> Full access to manage sites, machines, and view all data</li>
              <li><strong>Staff:</strong> Can update machine status for their assigned site</li>
              <li><strong>Viewer:</strong> Read-only access to view machine status</li>
            </ul>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Supabase Notes</h4>
            <p className="text-sm text-muted-foreground">
              Create users in Supabase Auth, then set their role and site in the
              <span className="font-medium text-foreground"> profiles</span> table.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
