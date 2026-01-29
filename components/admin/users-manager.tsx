'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Site, Profile } from '@/lib/types'

interface UsersManagerProps {
  users: (Profile & { site: Site | null })[]
  sites: Site[]
}

const roleBadgeVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  staff: 'secondary',
  viewer: 'outline',
}

export function UsersManager({ users }: UsersManagerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          View registered users and their access levels. Users are created automatically on Supabase signup.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name || 'Unknown'}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={roleBadgeVariants[user.role] || 'outline'} className="capitalize">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.site?.name || 'All Sites'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
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
