'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Ingredient, FamilyMember } from '@/lib/types'

function getDays(startOffset: number): Date[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: 10 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + startOffset + i)
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

// Un pasto pianificato = membro + slot + portata + ingrediente
// Usiamo: memberGroup=memberId, notes=portata, mealOptionId=ingredientId

const CAT_FOR_PORTATA: Record<Portata, string[]> = {
  primo: ['primo', 'sauce', 'jolly'],
  secondo: ['protein', 'dairy', 'jolly'],
  contorno: ['side', 'jolly'],
}

function PickIngredientSheet({
  member,
  portata,
  slot,
  date,
  ingredients,
  onClose,
  onSaved,
}: {
  member: FamilyMember
  portata: Portata
  slot: string
  date: Date
  ingredients: Ingredient[]
  onClose: () => void
  onSaved: () => void
}) {
  const [selected, setSelected] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickName, setQuickName] = useState('')
  const [quickCategory, setQuickCategory] = useState('protein')
  const [quickStorage, setQuickStorage] = useState('fresh')
  const [addingNew, setAddingNew] = useState(false)

  const suggested = ingredients.filter(i => CAT_FOR_PORTATA[portata].includes(i.category))
  const list = showAll ? ingredients : (suggested.length > 0 ? suggested : ingredients)

  const saveQuickAdd = async () => {
    if (!quickName.trim()) return
    setAddingNew(true)
    const res = await fetch('/api/ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: quickName.trim(),
        category: quickCategory,
        storageType: quickStorage,
        quantity: 1, unit: 'pz', perishabilityScore: 50,
        status: 'closed', totalServings: 0, whoEatsIt: [],
        allowedMemberIds: [], excludedMemberIds: [],
      }),
    })
    const newIng = await res.json()
    setAddingNew(false)
    setShowQuickAdd(false)
    setQuickName('')
    setSelected(newIng.id)
    onSaved() // ricarica lista ingredienti
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)

    // Salva il pasto pianificato
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

    // Scala le porzioni dell'ingrediente (-1)
    const ing = ingredients.find(i => i.id === selected)
    if (ing && ing.totalServings > 0) {
      await fetch(`/api/ingredients/${selected}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalServings: Math.max(0, ing.totalServings - 1) }),
      })
    }

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
            <h2 className="font-bold text-zinc-100">{member.name} — {PORTATE.find(p => p.key === portata)?.label}</h2>
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
                <p className="text-xs text-zinc-600 mt-0.5">{ing.totalServings} porzioni rimaste</p>
              )}
            </button>
          ))}
        </div>

        {showQuickAdd ? (
          <div className="px-5 pb-4 pt-2 border-t border-zinc-800 space-y-3">
            <p className="text-xs font-semibold text-zinc-400">Nuovo ingrediente</p>
            <input
              className="input-field"
              placeholder="Nome (es. Pesce spada)"
              value={quickName}
              onChange={e => setQuickName(e.target.value)}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2">
              <select className="select-field" value={quickCategory} onChange={e => setQuickCategory(e.target.value)}>
                <option value="protein">Proteina</option>
                <option value="side">Contorno</option>
                <option value="primo">Primo</option>
                <option value="sauce">Sugo</option>
                <option value="dairy">Latticino</option>
                <option value="jolly">Jolly</option>
              </select>
              <select className="select-field" value={quickStorage} onChange={e => setQuickStorage(e.target.value)}>
                <option value="fresh">Fresco</option>
                <option value="freezer">Freezer</option>
                <option value="pantry">Dispensa</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowQuickAdd(false)} className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-sm">
                Annulla
              </button>
              <button onClick={saveQuickAdd} disabled={!quickName.trim() || addingNew}
                className="flex-1 py-2 rounded-xl bg-amber-400 text-zinc-950 font-semibold text-sm disabled:opacity-40">
                {addingNew ? 'Salvo...' : 'Aggiungi'}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-2 pt-1">
            <button onClick={() => setShowQuickAdd(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-zinc-700 text-zinc-500 text-sm active:border-amber-400 active:text-amber-400 transition-colors">
              + Aggiungi nuovo ingrediente
            </button>
          </div>
        )}

        <div className="px-5 pb-6 pt-2">
          <button onClick={save} disabled={!selected || saving} className="btn-primary w-full disabled:opacity-40">
            {saving ? 'Salvo...' : 'Conferma'}
          </button>
        </div>
      </div>
    </>
  )
}

function MemberCard({
  member,
  date,
  slot,
  meals,
  ingredients,
  onRemove,
  onAdd,
}: {
  member: FamilyMember
  date: Date
  slot: string
  meals: any[]
  ingredients: Ingredient[]
  onRemove: (id: string) => void
  onAdd: (portata: Portata) => void
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
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 w-16 flex-shrink-0">{label}</span>
              {meal ? (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm text-zinc-200 flex-1">{getIngName(meal.mealOptionId)}</span>
                  <button onClick={() => onRemove(meal.id)} className="text-zinc-700 active:text-red-400 transition-colors p-0.5">
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
  const router = useRouter()
  const [meals, setMeals] = useState<any[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [picking, setPicking] = useState<{ member: FamilyMember; portata: Portata; slot: string } | null>(null)
  const [dayOffset, setDayOffset] = useState(0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = getDays(dayOffset)

  const load = useCallback(async () => {
    const allDays = getDays(dayOffset)
    const from = allDays[0].toISOString().split('T')[0]
    const to = allDays[allDays.length - 1].toISOString().split('T')[0]
    const [planned, ings, mems] = await Promise.all([
      fetch(`/api/planned-meals?from=${from}&to=${to}`).then(r => r.json()),
      fetch('/api/ingredients').then(r => r.json()),
      fetch('/api/members').then(r => r.json()),
    ])
    setMeals(Array.isArray(planned) ? planned : [])
    setIngredients(Array.isArray(ings) ? ings.filter((i: Ingredient) => i.status !== 'consumed') : [])
    setMembers(Array.isArray(mems) ? mems : [])
    setLoading(false)
  }, [dayOffset])

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
  const hasMealsOnDay = (d: Date) => getMealsForDay(d).length > 0

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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-zinc-100">Planner</h1>
          <button
            onClick={() => {
              const dateStr = activeDay.toISOString().split('T')[0]
              router.push(`/planner/suggest?date=${dateStr}&slot=dinner`)
            }}
            className="bg-amber-400 text-zinc-950 font-semibold text-sm px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
            Suggerisci
          </button>
        </div>

        {/* Navigazione giorni */}
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => { setDayOffset(o => Math.max(0, o - 10)); setSelectedDay(null) }}
            disabled={dayOffset === 0}
            className="text-zinc-500 disabled:opacity-20 p-1 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1">
            {days.map((d, i) => {
              const isToday = d.toDateString() === today.toDateString()
              const isActive = d.toDateString() === activeDay.toDateString()
              const dayIndex = d.getDay()
              const shortLabel = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'][dayIndex]
              return (
                <button key={i} onClick={() => setSelectedDay(d)}
                  className={`flex-shrink-0 flex flex-col items-center px-2.5 py-2 rounded-xl transition-colors ${
                    isActive ? 'bg-amber-400 text-zinc-950' :
                    isToday ? 'bg-zinc-800 text-amber-400 border border-amber-400/30' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                  <span className="text-[10px] font-medium">{shortLabel}</span>
                  <span className="text-sm font-bold">{d.getDate()}</span>
                  {hasMealsOnDay(d) && (
                    <div className={`w-1 h-1 rounded-full mt-0.5 ${isActive ? 'bg-zinc-950' : 'bg-amber-400'}`} />
                  )}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => { setDayOffset(o => o + 10); setSelectedDay(null) }}
            className="text-zinc-500 p-1 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 space-y-5 mt-2">
          <h2 className="text-base font-bold text-zinc-100">
            {['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'][activeDay.getDay()]}
            {' '}<span className="font-normal text-zinc-500 text-sm">{activeDay.getDate()}/{activeDay.getMonth()+1}</span>
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
