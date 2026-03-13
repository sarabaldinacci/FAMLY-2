'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Ingredient, FamilyMember } from '@/lib/types'
import { calcServingsInfo, STATUS_COLOR, STORAGE_COLOR, STORAGE_LABELS } from '@/lib/types'

function UrgencyBadge({ ing }: { ing: Ingredient }) {
  const isExpiringSoon = ing.expiryDate && new Date(ing.expiryDate) < new Date(Date.now() + 2 * 86400000)
  const isOpened = ing.status === 'opened'
  const isUrgent = ing.status === 'urgent'

  if (!isExpiringSoon && !isOpened && !isUrgent) return null

  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
      isUrgent || isExpiringSoon ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
    }`}>
      {isExpiringSoon ? 'Scade presto' : isUrgent ? 'Urgente' : 'Aperto'}
    </span>
  )
}

export default function HomePage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/ingredients').then(r => r.json()),
      fetch('/api/members').then(r => r.json()),
    ]).then(([ings, mems]) => {
      setIngredients(ings)
      setMembers(mems)
      setLoading(false)
    })
  }, [])

  const urgent = ingredients.filter(i =>
    i.status === 'urgent' ||
    i.status === 'opened' ||
    (i.expiryDate && new Date(i.expiryDate) < new Date(Date.now() + 3 * 86400000))
  ).slice(0, 6)

  const withServings = ingredients.filter(i => i.totalServings > 0 && i.category === 'protein')

  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="px-4 pt-8 pb-4 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-zinc-500 capitalize">{today}</p>
        <h1 className="text-2xl font-bold text-zinc-100 mt-0.5">Ciao Sara 👋</h1>
        <p className="text-sm text-zinc-400 mt-1">Cosa c&apos;è per cena stasera?</p>
      </div>

      {/* CTA suggerisci cena */}
      <Link href="/planner/suggest"
        className="block bg-amber-400 text-zinc-950 rounded-2xl px-5 py-4 active:scale-95 transition-transform">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-base">Suggerisci la cena</p>
            <p className="text-xs mt-0.5 opacity-70">Basato su quello che hai in casa</p>
          </div>
          <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      </Link>

      {/* Proteine tracciate */}
      {!loading && withServings.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 mb-3">Secondi in casa</h2>
          <div className="space-y-2">
            {withServings.map(ing => {
              const info = calcServingsInfo(ing, members)
              return (
                <div key={ing.id} className="card-tight px-4 py-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${STORAGE_COLOR[ing.storageType]}`}>
                    {ing.storageType === 'freezer' ? '🧊' : ing.storageType === 'fresh' ? '🥩' : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-100 truncate">{ing.name}</p>
                      <UrgencyBadge ing={ing} />
                    </div>
                    <p className="text-xs text-zinc-500">{info.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-amber-400">{info.mealsCount}</p>
                    <p className="text-[10px] text-zinc-600">{info.mealsCount === 1 ? 'cena' : 'cene'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Urgenti */}
      {!loading && urgent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-400">Da usare presto</h2>
            <Link href="/pantry?filter=urgent" className="text-xs text-amber-400">Vedi tutti</Link>
          </div>
          <div className="space-y-2">
            {urgent.map(ing => (
              <div key={ing.id} className="card-tight px-4 py-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${STORAGE_COLOR[ing.storageType]}`}>
                  {ing.storageType === 'freezer' ? '🧊' : ing.storageType === 'fresh' ? '🌿' : '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-100 truncate">{ing.name}</p>
                  <p className="text-xs text-zinc-500">{STORAGE_LABELS[ing.storageType]}</p>
                </div>
                <UrgencyBadge ing={ing} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && ingredients.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <p className="text-4xl">🛒</p>
          <p className="text-sm text-zinc-400">La dispensa è vuota.<br />Aggiungi i tuoi ingredienti per iniziare.</p>
          <Link href="/pantry" className="btn-primary inline-block px-6">Vai alla dispensa</Link>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link href="/planner" className="card-tight px-4 py-4 active:scale-95 transition-transform">
          <div className="text-2xl mb-2">📅</div>
          <p className="text-sm font-semibold text-zinc-200">Planner</p>
          <p className="text-xs text-zinc-500">Pianifica la settimana</p>
        </Link>
        <Link href="/pantry" className="card-tight px-4 py-4 active:scale-95 transition-transform">
          <div className="text-2xl mb-2">🧺</div>
          <p className="text-sm font-semibold text-zinc-200">Dispensa</p>
          <p className="text-xs text-zinc-500">{loading ? '…' : `${ingredients.length} ingredienti`}</p>
        </Link>
      </div>
    </div>
  )
}
