'use client'
import { useEffect, useState, useCallback } from 'react'
import type { Ingredient, FamilyMember } from '@/lib/types'

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

const PORTATE = [
  { key: 'primo', label: 'Primo' },
  { key: 'secondo', label: 'Secondo' },
  { key: 'contorno', label: 'Contorno' },
] as const
type Portata = typeof PORTATE[number]['key']

const CAT_FOR_PORTATA: Record<Portata, string[]> = {
  primo: ['primo', 'sauce', 'jolly'],
  secondo: ['protein', 'dairy', 'jolly'],
  contorno: ['side', 'jolly'],
}

function PickIngredientSheet({
  member, portata, slot, date, ingredients, onClose, onSaved,
}: {
  member: FamilyMember; portata: Portata; slot: string; date: Date
  ingredients: Ingredient[]; onClose: () => void; onSaved: () => void
}) {
  const [selected, setSelected] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const suggested = ingredients.filter(i => CAT_FOR_PORTATA[portata].includes(i.category))
  const list = showAll ? ingredients : (suggested.length > 0 ? suggested : ingredients)

  const save = async () => {
    if (!selected) return
    setSaving(true)
    await fetch('/api/planned-meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: date.toISOString(),
        slot,
        memberGroup: member.id,
        mealOptionId: selected,
        notes: portata,
        overrides: [],
      }),
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-zinc-100">
              {member.name} — {PORTATE.find(p => p.key === portata)?.label}
            </h2>
            <p className="text-xs text-zinc-500">{slot === 'dinner' ? 'Cena' : 'Pranzo'}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pt-3 pb-2 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {showAll ? 'Tutti gli ingredienti' : `Suggeriti per ${PORTATE.find(p => p.key === portata)?.label.toLowerCase()}`}
          </p>
          <button onClick={() => setShowAll(v => !v)} className="text-xs text-amber-400">
            {showAll ? 'Mostra suggeriti' : 'Mostra tutti'}
          </button>
        </div>

        <div className="px-5 pb-2 max-h-64 overflow-y-auto space-y-2">
          {list.length === 0 ? (
            <p className="text-sm text-zinc-600 py-4 text-center">Nessun ingrediente disponibile</p>
          ) : list.map(ing => (
            <button key={ing.id} onClick={() => setSelected(ing.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                selected === ing.id
                  ? 'bg-amber-400/20 border-amber-400/60 text-amber-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300'
              }`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{ing.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  ing.status === 'urgent' ? 'bg-red-900/40 text-red-400' :
                  ing.status === 'opened' ? 'bg-amber-900/30 text-amber-500' :
                  'bg-zinc-700 text-zinc-500'
                }`}>
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
          <button onClick={save} disabled={!selected || saving} className="btn-primary w-full disabled:opacity-40">
            {saving ? 'Salvo...' : 'Conferma'}
          </button>
        </div>
      </div>
    </>
  )
}

function MemberCard({
  member, date, slot, meals, ingredients, onRemove, onAdd,
}: {
  member: FamilyMember; date: Date; slot: string; meals: any[]
  ingredients: Ingredient[]; onRemove: (id: string) => void; onAdd: (portata: Portata) => void
}) {
  const myMeals = meals.filter(m => m.memberGroup === member.id && m.slot === slot)
  const getIngName = (id: string) => ingredients.find(i => i.id === id)?.name ?? id
  const portataMap: Record<string, any> = {}
  myMeals.forEach(m => { if (m.notes) portataMap[m.notes] = m })

  return (
    <div className="card-tight px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-amber-400/20 flex items-center justify-center text-sm">
          {member.type === 'adult' ? '🧑' : '👶'}
        </div>
        <p className="text-sm font-bold text-zinc-100">{member.name}</p>
      </div>
      <div className="space-y-2">
        {PORTATE.map(({ key, label }) => {
          const meal = portataMap[key]
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-zinc-600 w-16 flex-shrink-0">{label}</span>
              {meal ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm text-zinc-200 flex-1 truncate">{getIngName(meal.mealOptionId)}</span>
                  <button onClick={() => onRemove(meal.id)}
                    className="text-zinc-700 active:text-red-400 transition-colors p-0.5 flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button onClick={() => onAdd(key)}
                  className="text-xs text-zinc-700 active:text-amber-400 transition-colors flex-1 text-left">
                  + aggiungi
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PlannerPage() {
  const [meals, setMeals] = useState<any[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [picking, setPicking] = useState<{ member: FamilyMember; portata: Portata; slot: string } | null>(null)

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

  const activeDay = selectedDay ?? today

  const getMealsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return meals.filter(m => m.date.split('T')[0] === dateStr)
  }

  const removeMeal = async (id: string) => {
    await fetch(`/api/planned-meals/${id}`, { method: 'DELETE' })
    load()
  }

  const dayMeals = getMealsForDay(activeDay)

  const renderSlot = (slot: string) => (
    <div className="space-y-2">
      {members.map(member => (
        <MemberCard
          key={member.id}
          member={member}
          date={activeDay}
          slot={slot}
          meals={dayMeals}
          ingredients={ingredients}
          onRemove={removeMeal}
          onAdd={(portata) => setPicking({ member, portata, slot })}
        />
      ))}
    </div>
  )

  return (
    <div className="pb-4">
      <div className="px-4 pt-6 pb-3 sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <h1 className="text-xl font-bold text-zinc-100 mb-4">Planner</h1>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
          {week.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString()
            const isActive = d.toDateString() === activeDay.toDateString()
            const hasMeals = getMealsForDay(d).length > 0
            return (
              <button key={i} onClick={() => setSelectedDay(d)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-colors ${
                  isActive ? 'bg-amber-400 text-zinc-950' :
                  isToday ? 'bg-zinc-800 text-amber-400 border border-amber-400/30' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                <span className="text-[10px] font-medium">{DAY_SHORT[i]}</span>
                <span className="text-sm font-bold">{d.getDate()}</span>
                {hasMeals && (
                  <div className={`w-1 h-1 rounded-full mt-0.5 ${isActive ? 'bg-zinc-950' : 'bg-amber-400'}`} />
                )}
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
        <div className="px-4 space-y-5 mt-2">
          <h2 className="text-base font-bold text-zinc-100">
            {DAY_FULL[activeDay.getDay() === 0 ? 6 : activeDay.getDay() - 1]}
            {activeDay.toDateString() === today.toDateString() && (
              <span className="text-xs font-medium text-amber-400 ml-2">Oggi</span>
            )}
          </h2>

          {isWeekend(activeDay) && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Pranzo</p>
              {renderSlot('lunch')}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Cena</p>
            {renderSlot('dinner')}
          </div>
        </div>
      )}

      {picking && (
        <PickIngredientSheet
          member={picking.member}
          portata={picking.portata}
          slot={picking.slot}
          date={activeDay}
          ingredients={ingredients}
          onClose={() => setPicking(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
