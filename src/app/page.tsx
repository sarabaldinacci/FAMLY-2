'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Ingredient, FamilyMember } from '@/lib/types'
import { calcServingsInfo, STORAGE_COLOR, STORAGE_LABELS } from '@/lib/types'

function daysDiff(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
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
      setIngredients(Array.isArray(ings) ? ings : [])
      setMembers(Array.isArray(mems) ? mems : [])
      setLoading(false)
    })
  }, [])

  const atRisk = ingredients
    .filter(i => i.status !== 'consumed')
    .filter(i =>
      i.status === 'urgent' ||
      i.status === 'opened' ||
      (i.expiryDate && daysDiff(i.expiryDate) <= 4)
    )
    .sort((a, b) => {
      if (a.status === 'urgent' && b.status !== 'urgent') return -1
      if (b.status === 'urgent' && a.status !== 'urgent') return 1
      if (a.expiryDate && b.expiryDate) return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      if (a.expiryDate) return -1
      if (b.expiryDate) return 1
      return 0
    })
    .slice(0, 5)

  const withServings = ingredients.filter(i => i.totalServings > 0 && i.status !== 'consumed')

  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="px-4 pt-8 pb-4 space-y-6">
      <div>
        <p className="text-xs text-zinc-500 capitalize">{today}</p>
        <h1 className="text-2xl font-bold text-zinc-100 mt-0.5">Ciao Sara</h1>
        <p className="text-sm text-zinc-400 mt-1">Cosa c&apos;è per cena stasera?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/planner" className="card-tight px-4 py-4 active:scale-95 transition-transform">
          <div className="text-2xl mb-2">📅</div>
          <p className="text-sm font-semibold text-zinc-200">Planner</p>
          <p className="text-xs text-zinc-500">Pianifica la settimana</p>
        </Link>
        <Link href="/pantry" className="card-tight px-4 py-4 active:scale-95 transition-transform">
          <div className="text-2xl mb-2">🧺</div>
          <p className="text-sm font-semibold text-zinc-200">Dispensa</p>
          <p className="text-xs text-zinc-500">{loading ? '…' : `${ingredients.filter(i => i.status !== 'consumed').length} ingredienti`}</p>
        </Link>
      </div>

      {!loading && atRisk.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-400">Da usare presto</h2>
            <Link href="/pantry" className="text-xs text-amber-400">Vedi dispensa</Link>
          </div>
          <div className="space-y-2">
            {atRisk.map(ing => {
              const diff = ing.expiryDate ? daysDiff(ing.expiryDate) : null
              let urgencyLabel = ''
              let urgencyColor = 'text-zinc-500'
              if (ing.status === 'urgent') { urgencyLabel = 'Urgente'; urgencyColor = 'text-red-400' }
              else if (diff !== null && diff < 0) { urgencyLabel = 'Scaduto'; urgencyColor = 'text-red-400' }
              else if (diff === 0) { urgencyLabel = 'Scade oggi'; urgencyColor = 'text-red-400' }
              else if (diff !== null && diff <= 2) { urgencyLabel = `Scade tra ${diff}gg`; urgencyColor = 'text-amber-400' }
              else if (diff !== null) { urgencyLabel = `Scade tra ${diff}gg`; urgencyColor = 'text-zinc-500' }
              else if (ing.status === 'opened') { urgencyLabel = 'Aperto'; urgencyColor = 'text-amber-400' }

              return (
                <div key={ing.id} className="card-tight px-4 py-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${STORAGE_COLOR[ing.storageType]}`}>
                    {ing.storageType === 'freezer' ? '🧊' : ing.storageType === 'fresh' ? '🌿' : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-100 truncate">{ing.name}</p>
                    <p className="text-xs text-zinc-500">{STORAGE_LABELS[ing.storageType]}</p>
                  </div>
                  <span className={`text-xs font-medium flex-shrink-0 ${urgencyColor}`}>{urgencyLabel}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
                    <p className="text-sm font-semibold text-zinc-100 truncate">{ing.name}</p>
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

      {!loading && ingredients.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <p className="text-4xl">🛒</p>
          <p className="text-sm text-zinc-400">La dispensa è vuota.<br />Aggiungi i tuoi ingredienti per iniziare.</p>
          <Link href="/pantry" className="btn-primary inline-block px-6">Vai alla dispensa</Link>
        </div>
      )}
    </div>
  )
}
