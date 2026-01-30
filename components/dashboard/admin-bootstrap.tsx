"use client"

import type { FormEvent } from 'react'
import { useState, useTransition } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { bootstrapAdmin } from '@/lib/actions/admin'

interface AdminBootstrapProps {
  enabled: boolean
}

export function AdminBootstrap({ enabled }: AdminBootstrapProps) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [result, setResult] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!enabled) return null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setResult(null)
    startTransition(async () => {
      const response = await bootstrapAdmin(code)
      if (response?.error) {
        setResult({ type: 'error', message: response.error })
        return
      }
      setResult({ type: 'success', message: 'You are now an admin. Refreshing...' })
      setTimeout(() => {
        window.location.reload()
      }, 500)
    })
  }

  return (
    <Card className="mb-6 border-dashed border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <ShieldCheck className="h-5 w-5" />
          Admin setup
        </CardTitle>
        <CardDescription>
          Use this one-time setup to make your account an admin when no admins exist yet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-amber-200 text-amber-900 hover:bg-amber-50">
              Enter setup code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Claim admin access</DialogTitle>
              <DialogDescription>
                Enter the admin setup code from your environment settings.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Admin setup code"
                autoComplete="off"
              />
              {result && (
                <Alert variant={result.type === 'error' ? 'destructive' : 'default'}>
                  <AlertTitle>{result.type === 'error' ? 'Unable to set admin' : 'Success'}</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Claim admin
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
