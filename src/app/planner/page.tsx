'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { PlannedMeal, MealOption } from '@/lib/types'
import { MEAL_TYPE_LABELS } from '@/lib/types'

function getWeekDays() {
  const today = new Date()
  const day = today.getDay() // 0=Sun
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

export default function PlannerPage() {
  const [meals, setMeals] = useState<PlannedMeal[]>([])
  const [mealOptions, setMealOptions] = useState<MealOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [addingSlot, setAddingSlot] = useState<{ date: Date; slot: string; group: string } | null>(null)
  const [selectedOption, setSelectedOption] = useState('')
  const [saving, setSaving] = useState(false)

  const week = getWeekDays()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const load = useCallback(async () => {
    const from = week[0].toISOString().split('T')[0]
    const to = week[6].toISOString().split('T')[0]
    const [planned, options] = await Promise.all([
      fetch(`/api/planned-meals?from=${from}&to=${to}`).then(r => r.json()),
      fetch('/api/meal-options').then(r => r.json()),
    ])
    setMeals(Array.isArray(planned) ? planned : [])
    setMealOptions(Array.isArray(options) ? options : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const getMealsForDay = (date: Date, slot: string) => {
    const dateStr = date.toISOString().split('T')[0]
    return meals.filter(m => m.date.split('T')[0] === dateStr && m.slot === slot)
  }

  const getOptionName = (id: string) =>
    mealOptions.find(o => o.id === id)?.name ?? '—'

  const openAdd = (date: Date, slot: string, group: string) => {
    setAddingSlot({ date, slot, group })
    setSelectedOption('')
  }

  const saveSlot = async () => {
    if (!addingSlot || !selectedOption) return
    setSaving(true)
    await fetch('/api/planned-meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: addingSlot.date.toISOString(),
        slot: addingSlot.slot,
        memberGroup: addingSlot.group,
        mealOptionId: selectedOption,
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

  return (
    <div className="pb-4">
      <div className="px-4 pt-6 pb-3 sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-zinc-100">Planner</h1>
          <Link href="/planner/suggest" className="bg-amber-400 text-zinc-950 font-semibold text-xs px-3 py-1.5 rounded-xl">
            Suggerisci
          </Link>
        </div>

        {/* Day selector */}
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
        <div className="px-4 space-y-4 mt-2">
          <h2 className="text-base font-bold text-zinc-100">
            {DAY_FULL[activeDay.getDay() === 0 ? 6 : activeDay.getDay() - 1]}
            {activeDay.toDateString() === today.toDateString() && (
              <span className="text-xs font-medium text-amber-400 ml-2">Oggi</span>
            )}
          </h2>

          {/* Pranzo (solo weekend) */}
          {isWeekend(activeDay) && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Pranzo</p>
              {['adults', 'children'].map(group => {
                const slotMeals = getMealsForDay(activeDay, 'lunch').filter(m => m.memberGroup === group)
                return (
                  <div key={group} className="card-tight px-4 py-3 mb-2">
                    <p className="text-xs text-zinc-500 mb-2">{group === 'adults' ? 'Adulti' : 'Bambini'}</p>
                    {slotMeals.length > 0 ? (
                      slotMeals.map(m => (
                        <div key={m.id} className="flex items-center justify-between">
                          <p className="text-sm text-zinc-200">{getOptionName(m.mealOptionId)}</p>
                          <button onClick={() => removeMeal(m.id)} className="text-zinc-700 active:text-red-400 p-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))
                    ) : (
                      <button onClick={() => openAdd(activeDay, 'lunch', group)}
                        className="text-xs text-zinc-600 active:text-amber-400 transition-colors">
                        + Aggiungi
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Cena */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Cena</p>
            {['adults', 'children'].map(group => {
              const slotMeals = getMealsForDay(activeDay, 'dinner').filter(m => m.memberGroup === group)
              return (
                <div key={group} className="card-tight px-4 py-3 mb-2">
                  <p className="text-xs text-zinc-500 mb-2">{group === 'adults' ? 'Adulti' : 'Bambini'}</p>
                  {slotMeals.length > 0 ? (
                    slotMeals.map(m => (
                      <div key={m.id} className="flex items-center justify-between">
                        <p className="text-sm text-zinc-200">{getOptionName(m.mealOptionId)}</p>
                        <button onClick={() => removeMeal(m.id)} className="text-zinc-700 active:text-red-400 p-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <button onClick={() => openAdd(activeDay, 'dinner', group)}
                      className="text-xs text-zinc-600 active:text-amber-400 transition-colors">
                      + Aggiungi
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add meal sheet */}
      {addingSlot && (
        <>
          <div className="sheet-overlay" onClick={() => setAddingSlot(null)} />
          <div className="sheet">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div>
                <h2 className="font-bold text-zinc-100">Scegli pasto</h2>
                <p className="text-xs text-zinc-500 capitalize">
                  {addingSlot.slot === 'dinner' ? 'Cena' : 'Pranzo'} · {addingSlot.group === 'adults' ? 'Adulti' : 'Bambini'}
                </p>
              </div>
              <button onClick={() => setAddingSlot(null)} className="text-zinc-500 p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
              {mealOptions.map(o => (
                <button key={o.id} onClick={() => setSelectedOption(o.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    selectedOption === o.id
                      ? 'bg-amber-400/20 border-amber-400/60 text-amber-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}>
                  <p className="text-sm font-medium">{o.name}</p>
                  <p className="text-xs opacity-60">{MEAL_TYPE_LABELS[o.mealType]}</p>
                </button>
              ))}
            </div>
            <div className="px-5 pb-5">
              <button onClick={saveSlot} disabled={!selectedOption || saving} className="btn-primary w-full">
                {saving ? 'Salvo...' : 'Conferma'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
