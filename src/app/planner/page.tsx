'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { PlannedMeal, Ingredient, FamilyMember } from '@/lib/types'

function getWeekDays() {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const DAY_FULL = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6

const CAT_LABELS: Record<string, string> = {
  protein: 'Proteine', side: 'Contorno', primo: 'Primo',
  sauce: 'Sugo', jolly: 'Jolly', dairy: 'Latticini',
}
const STATUS_COLOR: Record<string, string> = {
  urgent: 'bg-red-900/40 text-red-400',
  opened: 'bg-amber-900/30 text-amber-500',
  closed: 'bg-zinc-700 text-zinc-500',
  consumed: 'bg-zinc-800 text-zinc-600',
}

export default function PlannerPage() {
  const [meals, setMeals] = useState<PlannedMeal[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [addingSlot, setAddingSlot] = useState<{ date: Date; slot: string } | null>(null)
  const [selectedIngredient, setSelectedIngredient] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [catFilter, setCatFilter] = useState('all')

  const week = getWeekDays()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const load = useCallback(async () => {
    const from = week[0].toISOString().split('T')[0]
    const to = week[6].toISOString().split('T')[0]
    const [planned, ings, mems] = await Promise.all([
      fetch(`/api/planned-meals?from=${from}&to=${to}`).then(r => r.json()),
      fetch('/api/ingredients').then(r => r.json()),
      fetch('/api/members').then(r => r.json()),
    ])
    setMeals(Array.isArray(planned) ? planned : [])
    setIngredients(Array.isArray(ings) ? ings.filter((i: Ingredient) => i.status !== 'consumed') : [])
    setMembers(Array.isArray(mems) ? mems : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const getMealsForDay = (date: Date, slot: string) => {
    const dateStr = date.toISOString().split('T')[0]
    return meals.filter(m => m.date.split('T')[0] === dateStr && m.slot === slot)
  }

  const getIngredientName = (id: string) =>
    ingredients.find(i => i.id === id)?.name ?? id

  const getMemberNames = (ids: string[]) =>
    ids.map(id => members.find(m => m.id === id)?.name ?? id).join(', ')

  const openAdd = (date: Date, slot: string) => {
    setAddingSlot({ date, slot })
    setSelectedIngredient('')
    setSelectedMembers([])
    setCatFilter('all')
  }

  const toggleMember = (id: string) =>
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const saveSlot = async () => {
    if (!addingSlot || !selectedIngredient || selectedMembers.length === 0) return
    setSaving(true)
    await fetch('/api/planned-meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: addingSlot.date.toISOString(),
        slot: addingSlot.slot,
        memberGroup: selectedMembers.join(','),
        mealOptionId: selectedIngredient,
        overrides: [],
        notes: '',
      }),
    })
    await load()
    setAddingSlot(null)
    setSaving(false)
  }

  const removeMeal = async (id: string) => {
    await fetch(`/api/planned-meals/${id}`, { method: 'DELETE' })
    load()
  }

  const activeDay = selectedDay ?? today
  const categories = ['all', ...Array.from(new Set(ingredients.map(i => i.category)))]
  const filteredIngredients = catFilter === 'all' ? ingredients : ingredients.filter(i => i.category === catFilter)

  const btnLabel = !selectedIngredient
    ? 'Scegli un ingrediente'
    : selectedMembers.length === 0
    ? 'Scegli chi mangia'
    : 'Conferma'

  const renderMeals = (slotMeals: PlannedMeal[]) =>
    slotMeals.map(m => {
      const memberIds = m.memberGroup?.split(',').filter(Boolean) ?? []
      return (
        <div key={m.id} className="flex items-start justify-between py-2.5 border-b border-zinc-800/60 last:border-0">
          <div>
            <p className="text-sm font-medium text-zinc-200">{getIngredientName(m.mealOptionId)}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{getMemberNames(memberIds)}</p>
          </div>
          <button onClick={() => removeMeal(m.id)} className="text-zinc-700 active:text-red-400 p-1 ml-2 flex-shrink-0 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )
    })

  return (
    <div className="pb-4">
      <div className="px-4 pt-6 pb-3 sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-zinc-100">Planner</h1>
          <Link href="/planner/suggest" className="bg-amber-400 text-zinc-950 font-semibold text-xs px-3 py-1.5 rounded-xl">
            Suggerisci
          </Link>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
          {week.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString()
            const isActive = d.toDateString() === activeDay.toDateString()
            const hasMeals = getMealsForDay(d, 'dinner').length > 0
            return (
              <button key={i} onClick={() => setSelectedDay(d)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-colors ${
                  isActive ? 'bg-amber-400 text-zinc-950' :
                  isToday ? 'bg-zinc-800 text-amber-400 border border-amber-400/30' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                <span className="text-[10px] font-medium">{DAY_SHORT[i]}</span>
                <span className="text-sm font-bold">{d.getDate()}</span>
                {hasMeals && <div className={`w-1 h-1 rounded-full mt-0.5 ${isActive ? 'bg-zinc-950' : 'bg-amber-400'}`} />}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 space-y-4 mt-2">
          <h2 className="text-base font-bold text-zinc-100">
            {DAY_FULL[activeDay.getDay() === 0 ? 6 : activeDay.getDay() - 1]}
            {activeDay.toDateString() === today.toDateString() && (
              <span className="text-xs font-medium text-amber-400 ml-2">Oggi</span>
            )}
          </h2>

          {isWeekend(activeDay) && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Pranzo</p>
              <div className="card-tight px-4 py-3">
                {renderMeals(getMealsForDay(activeDay, 'lunch'))}
                <button onClick={() => openAdd(activeDay, 'lunch')}
                  className="text-xs text-zinc-600 active:text-amber-400 transition-colors mt-2 block">
                  + Aggiungi ingrediente
                </button>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Cena</p>
            <div className="card-tight px-4 py-3">
              {renderMeals(getMealsForDay(activeDay, 'dinner'))}
              <button onClick={() => openAdd(activeDay, 'dinner')}
                className="text-xs text-zinc-600 active:text-amber-400 transition-colors mt-2 block">
                + Aggiungi ingrediente
              </button>
            </div>
          </div>
        </div>
      )}

      {addingSlot && (
        <>
          <div className="sheet-overlay" onClick={() => setAddingSlot(null)} />
          <div className="sheet">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div>
                <h2 className="font-bold text-zinc-100">Aggiungi ingrediente</h2>
                <p className="text-xs text-zinc-500">{addingSlot.slot === 'dinner' ? 'Cena' : 'Pranzo'}</p>
              </div>
              <button onClick={() => setAddingSlot(null)} className="text-zinc-500 p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 pt-4 pb-2 space-y-4">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Chi mangia</p>
                <div className="flex flex-wrap gap-2">
                  {members.map(m => (
                    <button key={m.id} onClick={() => toggleMember(m.id)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                        selectedMembers.includes(m.id)
                          ? 'bg-amber-400 text-zinc-950 border-amber-400'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Ingrediente</p>
                <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-5 px-5">
                  {categories.map(c => (
                    <button key={c} onClick={() => setCatFilter(c)}
                      className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        catFilter === c
                          ? 'bg-zinc-700 text-zinc-100 border-zinc-600'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                      }`}>
                      {c === 'all' ? 'Tutti' : CAT_LABELS[c] ?? c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 pb-2 max-h-52 overflow-y-auto space-y-2">
              {filteredIngredients.length === 0 ? (
                <p className="text-sm text-zinc-600 py-2">Nessun ingrediente disponibile</p>
              ) : filteredIngredients.map(ing => (
                <button key={ing.id} onClick={() => setSelectedIngredient(ing.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                    selectedIngredient === ing.id
                      ? 'bg-amber-400/20 border-amber-400/60 text-amber-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{ing.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[ing.status] ?? ''}`}>
                      {ing.status === 'urgent' ? 'Urgente' : ing.status === 'opened' ? 'Aperto' : 'Chiuso'}
                    </span>
                  </div>
                  {ing.totalServings > 0 && (
                    <p className="text-xs text-zinc-600 mt-0.5">{ing.totalServings} porzioni</p>
                  )}
                </button>
              ))}
            </div>

            <div className="px-5 pb-6 pt-3">
              <button onClick={saveSlot}
                disabled={!selectedIngredient || selectedMembers.length === 0 || saving}
                className="btn-primary w-full disabled:opacity-40">
                {saving ? 'Salvo...' : btnLabel}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
