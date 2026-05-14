'use client'

import { LogOut, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation' // Added to detect active route
import { useSession, signOut } from 'next-auth/react'
import { Button } from '../ui/Button'
import halfLogo from '../../assets/HalfLogo.png' // Visual from Snippet 2

// Combined Snippet 2's labels with Snippet 1's routing structure

export function Topbar() {
  const pathname = usePathname() // Gets the current URL path
  const { data: session, status } = useSession()

  if (status === 'loading' || !session) return null

  const role = String((session?.user as any)?.role ?? '').toLowerCase();

  let NAV_ITEMS: Array<{ href: string; label: string }> = [];
  if (role === 'superadmin') {
    NAV_ITEMS = [
      { href: '/recibos', label: 'Recibos' },
      { href: '/asociados', label: 'Asociados' },
      { href: '/servicios', label: 'Servicios' },
      { href: '/inventory', label: 'Inventario' },
      { href: '/metricas', label: 'Métricas' },
      { href: '/usuarios', label: 'Empleados' },
    ]
  } else if (role === 'ceo') {
    NAV_ITEMS = [
      { href: '/inventory', label: 'Inventario' },
      { href: '/metricas', label: 'Métricas' },
    ]
  } else if (role === 'admin') {
    NAV_ITEMS = [
      { href: '/recibos', label: 'Recibos' },
      { href: '/asociados', label: 'Asociados' },
      { href: '/servicios', label: 'Servicios' },
      { href: '/inventory', label: 'Inventario' },
    ]
  } else {
    NAV_ITEMS = [
      { href: '/recibos', label: 'Recibos' },
      { href: '/asociados', label: 'Asociados' },
      { href: '/servicios', label: 'Servicios' },
    ]
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-800 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between py-3 px-4">
        
        <div className="flex items-center gap-6">
          <div className="flex h-14 items-center justify-center rounded-lg bg-white/10 px-3">
            <Image
              src={halfLogo}
              alt="Logo"
              className="h-10 w-auto object-contain"
            />
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-4 px-4 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'rounded-full px-6 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-white/10 ring-1 ring-white/20'
                      : 'hover:bg-white/10',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm md:flex">
            <User className="h-4 w-4" />
            <span>{session.user?.name ?? session.user?.email}</span>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Salir
          </Button>
        </div>
      </div>
    </header>
  )
}