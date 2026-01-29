'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { TJULogoCompact } from '@/components/tju-logo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Activity, Settings, UserIcon, LogOut, Menu, X, MonitorIcon as MonitorCog } from 'lucide-react'
import type { Profile } from '@/lib/types'

interface NavProps {
  user: User
  profile: Profile | null
}

export function DashboardNav({ user, profile }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  const isAdmin = profile?.role === 'admin'

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Activity },
    ...(isAdmin ? [{ href: '/dashboard/admin', label: 'Admin', icon: Settings }] : []),
  ]

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <TJULogoCompact />
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg leading-tight">LINAC Status</h1>
              <p className="text-xs text-primary-foreground/70">Radiation Oncology</p>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'hover:bg-primary-foreground/10 text-primary-foreground/80'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/display"
            target="_blank"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <MonitorCog className="h-4 w-4" />
            Display Mode
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
              >
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground">
                  <UserIcon className="h-4 w-4" />
                </div>
                <span className="hidden lg:block">{profile?.full_name || user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{profile?.full_name || 'User'}</p>
                <p className="text-muted-foreground text-xs">{profile?.email || user.email}</p>
                <p className="text-muted-foreground text-xs capitalize mt-1">
                  Role: {profile?.role || 'viewer'}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-primary-foreground/20 p-4 space-y-2 bg-primary">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-primary-foreground/20' : 'hover:bg-primary-foreground/10'
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            )
          })}
          <Link
            href="/display"
            target="_blank"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <MonitorCog className="h-5 w-5" />
            Display Mode
          </Link>
        </nav>
      )}
    </header>
  )
}
