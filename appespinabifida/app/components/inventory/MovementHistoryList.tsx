'use client'

import { Pencil } from 'lucide-react'

import type { InventoryMovement } from '../../lib/types/movements'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

function formatMovementLine(m: InventoryMovement) {
  const label = m.movementType === 'in' ? 'Entrada' : 'Salida'
  return `${label}: ${m.quantity} unidades`
}

function movementLabel(m: InventoryMovement) {
  return m.movementType === 'in' ? 'Entrada' : 'Salida'
}

function movementVariant(m: InventoryMovement) {
  return m.movementType === 'in' ? 'success' : 'failed'
}

function userLabel(m: InventoryMovement) {
  const firstName = m.userFirstName?.trim()
  const lastName = m.userLastName?.trim()
  const name = m.userName?.trim() || [firstName, lastName].filter(Boolean).join(' ').trim()
  const email = m.userEmail?.trim()
  const role = m.userRole?.trim()

  if (name && email) return `${name} · ${email}`
  if (name) return name
  if (email) return email
  if (role) return role
  return 'Usuario no disponible'
}

export function MovementHistoryList({
  items,
  loading,
  error,
  onEdit,
}: {
  items: InventoryMovement[]
  loading: boolean
  error: string | null
  onEdit?: (movement: InventoryMovement) => void
}) {
  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500" role="status">
        Cargando…
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-rose-700" role="alert">
        {error}
      </div>
    )
  }

  if (items.length === 0) {
    return <div className="p-6 text-sm text-slate-500">Sin resultados.</div>
  }

  return (
    <div className="space-y-4 p-5">
      {items.map((m) => (
        <div
          key={m.id}
          className="group rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200/70 transition hover:bg-white"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-600 text-base font-semibold text-white">
              {m.id}
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-slate-800">
                    {m.itemName}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                    <span className="font-medium text-slate-600">{m.itemType}</span>
                    <span aria-hidden>•</span>
                    <span>{m.date}</span>
                  </div>
                </div>

                <Badge variant={movementVariant(m)} className="shrink-0">
                  {movementLabel(m)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200/70">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Movimiento
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {formatMovementLine(m)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200/70">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Registrado por
                  </p>
                  <p className="text-sm font-medium text-slate-700">{userLabel(m)}</p>
                </div>
              </div>

            </div>

            {onEdit ? (
              <Button
                type="button"
                variant="ghost"
                className="h-10 w-10 shrink-0 rounded-xl p-0 opacity-90 group-hover:opacity-100"
                aria-label="Editar movimiento"
                onClick={() => onEdit(m)}
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

