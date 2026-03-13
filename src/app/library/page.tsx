'use client'
import { useEffect, useState, useCallback } from 'react'
import type { MealOption } from '@/lib/types'
import { MEAL_TYPE_LABELS } from '@/lib/types'

const GROUP_ORDER: Array<MealOption['mealType']> = [
  'children_dinner', 'adult_dinner', 'universal', 'children_lunch', 'adult_lunch'
]

function MealCard({ meal, onDelete }: { meal: MealOption; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)

  const del = async () => {
    if (!confirm(`Eliminare "${meal.name}"?`)) return
    setDeleting(true)
    await fetch(`/api/meal-options/${meal.id}`, { method: 'DELETE' })
    onDelete()
  }

  return (
    <div className="card-tight px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-100">{meal.name}</p>
        {meal.preparationNotes && (
          <p className="text-xs text-zinc-500 mt-0.5">{meal.preparationNotes}</p>
        )}
        <div className="flex gap-2 mt-1 flex-wrap">
          {meal.canBeFrozen && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-900/40 text-blue-400">Congela</span>
          )}
          {meal.tags?.map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500">{t}</span>
          ))}
        </div>
      </div>
      <button onClick={del} disabled={deleting}
        className="text-zinc-700 active:text-red-400 transition-colors p-1.5 flex-shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}

function AddMealSheet({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    name: '', mealType: 'children_dinner' as MealOption['mealType'],
    preparationNotes: '', canBeFrozen: false,
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await fetch('/api/meal-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        compatibleMemberIds: [],
        requiredIngredientIds: [],
        optionalIngredientIds: [],
        tags: [],
        servingsAdults: 2,
        servingsChildren: 2,
      }),
    })
    setSaving(false)
    onAdded()
    onClose()
  }

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="font-bold text-zinc-100">Nuovo pasto</h2>
          <button onClick={onClose} className="text-zinc-500 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Nome</label>
            <input className="input-field" placeholder="es. Pasta al tonno" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Tipo</label>
            <select className="select-field" value={form.mealType}
              onChange={e => setForm(f => ({ ...f, mealType: e.target.value as MealOption['mealType'] }))}>
              {GROUP_ORDER.map(k => (
                <option key={k} value={k}>{MEAL_TYPE_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Note preparazione</label>
            <input className="input-field" placeholder="es. Cottura 20 min" value={form.preparationNotes}
              onChange={e => setForm(f => ({ ...f, preparationNotes: e.target.value }))} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-10 h-6 rounded-full transition-colors relative ${form.canBeFrozen ? 'bg-amber-400' : 'bg-zinc-700'}`}
              onClick={() => setForm(f => ({ ...f, canBeFrozen: !f.canBeFrozen }))}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${form.canBeFrozen ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-zinc-300">Si può congelare</span>
          </label>
          <button onClick={save} disabled={saving || !form.name.trim()} className="btn-primary w-full">
            {saving ? 'Salvo...' : 'Aggiungi pasto'}
          </button>
        </div>
      </div>
    </>
  )
}

export default function LibraryPage() {
  const [meals, setMeals] = useState<MealOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch('/api/meal-options').then(r => r.json())
    setMeals(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const grouped = GROUP_ORDER.reduce((acc, type) => {
    acc[type] = meals.filter(m => m.mealType === type)
    return acc
  }, {} as Record<string, MealOption[]>)

  return (
    <div className="pb-4">
      <div className="px-4 pt-6 pb-4 sticky top-0 bg-zinc-950/95 backdrop-blur z-10 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">Pasti</h1>
        <button onClick={() => setShowAdd(true)} className="bg-amber-400 text-zinc-950 font-semibold text-sm px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
          + Aggiungi
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 space-y-6">
          {GROUP_ORDER.map(type => {
            const group = grouped[type]
            if (!group?.length) return null
            return (
              <section key={type}>
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  {MEAL_TYPE_LABELS[type]}
                </h2>
                <div className="space-y-2">
                  {group.map(m => <MealCard key={m.id} meal={m} onDelete={load} />)}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {showAdd && <AddMealSheet onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  )
}
