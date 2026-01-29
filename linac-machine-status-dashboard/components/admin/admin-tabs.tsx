'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Activity, Users } from 'lucide-react'
import { SitesManager } from './sites-manager'
import { MachinesManager } from './machines-manager'
import { UsersManager } from './users-manager'
import type { Site, Machine, Profile } from '@/lib/types'

interface AdminTabsProps {
  sites: Site[]
  machines: (Machine & { site: Site | null })[]
  users: (Profile & { site: Site | null })[]
}

export function AdminTabs({ sites, machines, users }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState('sites')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
        <TabsTrigger value="sites" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Sites</span>
        </TabsTrigger>
        <TabsTrigger value="machines" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="hidden sm:inline">Machines</span>
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Users</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sites">
        <SitesManager sites={sites} />
      </TabsContent>

      <TabsContent value="machines">
        <MachinesManager machines={machines} sites={sites} />
      </TabsContent>

      <TabsContent value="users">
        <UsersManager users={users} sites={sites} />
      </TabsContent>
    </Tabs>
  )
}
