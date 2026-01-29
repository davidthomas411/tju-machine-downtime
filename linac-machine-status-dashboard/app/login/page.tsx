import Image from 'next/image'
import { TJULogo } from '@/components/tju-logo'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="absolute inset-0 bg-[url('/brand/maps.jpg')] bg-cover bg-center opacity-10" />
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-card/90 backdrop-blur border border-border rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center text-center gap-6">
            <TJULogo size="lg" />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">LINAC Status Dashboard</h1>
              <p className="text-muted-foreground">
                This dashboard uses browser-based Basic Authentication for now.
                If you need access, contact your department administrator.
              </p>
            </div>

            <div className="w-full rounded-xl border border-border bg-muted/30 p-4 text-left">
              <p className="text-sm font-semibold text-foreground">Quick start (local dev)</p>
              <p className="text-sm text-muted-foreground mt-1">
                Default users are <span className="font-medium text-foreground">admin</span> and
                <span className="font-medium text-foreground"> user1</span> with passwords matching their usernames.
                Update <span className="font-medium text-foreground">BASIC_AUTH_USERS</span> to change them.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button asChild className="flex-1 bg-primary text-primary-foreground">
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a href="/api/logout">Switch User</a>
              </Button>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border w-full justify-center">
              <Image
                src="/brand/Blue-TJU_logo.jpg"
                alt="Thomas Jefferson University"
                width={160}
                height={46}
                className="object-contain"
              />
              <span className="text-xs text-muted-foreground">Department of Radiation Oncology</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
