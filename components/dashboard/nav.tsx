'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { toDisplayUsername } from '@/lib/auth/username'
import { BrandLogo } from '@/components/brand-logo'
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
import type { NetworkKey } from '@/lib/network'

interface NavProps {
  user: User
  profile: Profile | null
  canAdmin: boolean
  network: NetworkKey
}

export function DashboardNav({ user, profile, canAdmin, network }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()
  const isLvhn = network === 'lvhn'

  const displayName = profile?.full_name || toDisplayUsername(user.email) || 'User'
  const roleLabel = profile?.role || 'viewer'
  const roleDisplay = canAdmin && roleLabel !== 'admin' ? `${roleLabel} (admin override)` : roleLabel
  const displayHref = profile?.site_id
    ? `/display?site=${profile.site_id}`
    : `/display?network=${network}`

  const navLinks = [
    { href: '/dashboard', label: 'Staff Console', icon: Activity },
    ...(canAdmin ? [{ href: '/dashboard/admin', label: 'Admin', icon: Settings }] : []),
  ]

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 shadow-lg ${
        isLvhn ? 'bg-white text-slate-900 border-b border-slate-200' : 'bg-primary text-primary-foreground'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <BrandLogo network={network} variant="compact" />
            <div className="hidden sm:block">
              <h1 className="flex items-center gap-2 font-bold text-lg leading-tight">
                LINAC Status
                <span
                  className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${
                    isLvhn
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-primary-foreground/15 text-primary-foreground/80'
                  }`}
                >
                  Staff Console
                </span>
              </h1>
              <p className={`text-xs ${isLvhn ? 'text-slate-500' : 'text-primary-foreground/70'}`}>
                Radiation Oncology
              </p>
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
                  isLvhn
                    ? isActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'hover:bg-slate-100 text-slate-600'
                    : isActive
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
            href={displayHref}
            target="_blank"
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              isLvhn
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-accent text-accent-foreground hover:bg-accent/90'
            }`}
          >
            <MonitorCog className="h-4 w-4" />
            Display Mode
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`flex items-center gap-2 bg-transparent ${
                  isLvhn ? 'text-slate-700 hover:bg-slate-100' : 'text-primary-foreground hover:bg-primary-foreground/10'
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isLvhn ? 'bg-slate-900 text-white' : 'bg-accent text-accent-foreground'
                  }`}
                >
                  <UserIcon className="h-4 w-4" />
                </div>
                <span className="hidden lg:block">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{displayName}</p>
                <p className="text-muted-foreground text-xs">{user.email}</p>
                <p className="text-muted-foreground text-xs capitalize mt-1">
                  Role: {roleDisplay}
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
            className={`md:hidden bg-transparent ${
              isLvhn ? 'text-slate-700 hover:bg-slate-100' : 'text-primary-foreground hover:bg-primary-foreground/10'
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className={`md:hidden p-4 space-y-2 ${
          isLvhn ? 'border-t border-slate-200 bg-white' : 'border-t border-primary-foreground/20 bg-primary'
        }`}>
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  isLvhn
                    ? isActive
                      ? 'bg-slate-100'
                      : 'hover:bg-slate-100'
                    : isActive
                      ? 'bg-primary-foreground/20'
                      : 'hover:bg-primary-foreground/10'
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            )
          })}
          <Link
            href={displayHref}
            target="_blank"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
              isLvhn
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-accent text-accent-foreground hover:bg-accent/90'
            }`}
          >
            <MonitorCog className="h-5 w-5" />
            Display Mode
          </Link>
        </nav>
      )}
    </header>
  )
}
