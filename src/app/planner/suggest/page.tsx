'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Ingredient, FamilyMember, PlanningRule } from '@/lib/types'

// ─── Tipi locali ─────────────────────────────────────────────────────────────

interface MemberSuggestion {
  memberId: string
  memberName: string
  memberType: string
  primo: Ingredient | null
  secondo: Ingredient | null
  contorno: Ingredient | null
  notes: string[]
}

interface AcceptedMap {
  [key: string]: boolean
}

// ─── Engine suggerimento ─────────────────────────────────────────────────────

function scoreIngredient(ing: Ingredient, recentIds: string[]): number {
  let score = 0
  if (ing.status === 'urgent') score += 50
  if (ing.status === 'opened') score += 30
  if (ing.storageType === 'fresh') score += 15
  if (ing.storageType === 'freezer') score += 5
  if (ing.expiryDate) {
    const diff = Math.ceil((new Date(ing.expiryDate).getTime() - Date.now()) / 86400000)
    if (diff <= 1) score += 40
    else if (diff <= 3) score += 25
    else if (diff <= 5) score += 10
  }
  if (recentIds.includes(ing.id)) score -= 30
  return score
}

function canMemberEat(ing: Ingredient, member: FamilyMember, rules: PlanningRule[]): boolean {
  const biancaRule = rules.find(r => r.key === 'bianca_no_bresaola' && r.active)
  if (biancaRule && member.name === 'Bianca' && ing.id === 'ing-bresaola') return false

  const davideRule = rules.find(r => r.key === 'davide_vegetarian' && r.active)
  if (davideRule && member.name === 'Davide' && ing.category === 'protein') {
    const meat = ['pollo','manzo','maiale','salmone','pesce','hamburger','bresaola','findus','bastoncini','tonno','spada','carne','tacchino','prosciutto']
    if (meat.some(m => ing.name.toLowerCase().includes(m))) return false
  }

  if (ing.whoEatsIt && ing.whoEatsIt.length > 0) {
    if (!ing.whoEatsIt.includes(member.id)) return false
  }

  return true
}

function buildSuggestion(
  member: FamilyMember,
  ingredients: Ingredient[],
  rules: PlanningRule[],
  recentIds: string[],
): MemberSuggestion {
  const available = ingredients.filter(i =>
    i.status !== 'consumed' && canMemberEat(i, member, rules)
  )

  const byCategory = (cats: string[]) =>
    available
      .filter(i => cats.includes(i.category))
      .sort((a, b) => scoreIngredient(b, recentIds) - scoreIngredient(a, recentIds))

  const proteins = byCategory(['protein'])
  const sides = byCategory(['side'])
  const primos = byCategory(['primo', 'sauce'])

  const notes: string[] = []
  const secondo = proteins[0] ?? null
  if (secondo?.status === 'urgent') notes.push(`${secondo.name} scade presto — priorità alta`)
  else if (secondo?.status === 'opened') notes.push(`${secondo.name} già aperto — da finire`)

  const contorno = sides[0] ?? null
  if (contorno?.status === 'urgent') notes.push(`${contorno.name} scade presto`)

  let primo: Ingredient | null = null
  if (member.type === 'child') {
    primo = primos[0] ?? null
  } else {
    primo = primos.find(p => p.status === 'urgent' || p.status === 'opened') ?? null
  }

  return { memberId: member.id, memberName: member.name, memberType: member.type, primo, secondo, contorno, notes }
}

// ─── Componente ───────────────────────────────────────────────────────────────

const PORTATE = ['primo', 'secondo', 'contorno'] as const
type Portata = typeof PORTATE[number]
const PORTATA_LABEL: Record<Portata, string> = { primo: 'Primo', secondo: 'Secondo', contorno: 'Contorno' }

export default function SuggestPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center gap-3 py-16">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-500">Carico…</p>
      </div>
    }>
      <SuggestContent />
    </Suspense>
  )
}

function SuggestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const slotParam = searchParams.get('slot') ?? 'dinner'

  const [suggestions, setSuggestions] = useState<MemberSuggestion[]>([])
  const [accepted, setAccepted] = useState<AcceptedMap>({})
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)

  const load = useCallback(async () => {
    const [ings, mems, rulesRes, planned] = await Promise.all([
      fetch('/api/ingredients').then(r => r.json()),
      fetch('/api/members').then(r => r.json()),
      fetch('/api/rules').then(r => r.json()),
      fetch(`/api/planned-meals?from=${dateParam}&to=${dateParam}`).then(r => r.json()),
    ])

    const ingredients: Ingredient[] = Array.isArray(ings) ? ings : []
    const members: FamilyMember[] = Array.isArray(mems) ? mems : []
    const rules: PlanningRule[] = Array.isArray(rulesRes) ? rulesRes : (rulesRes?.rules ?? [])
    const recentIds: string[] = Array.isArray(planned) ? planned.map((m: any) => m.mealOptionId) : []

    const suggs = members.map(m => buildSuggestion(m, ingredients, rules, recentIds))
    setSuggestions(suggs)

    const initialAccepted: AcceptedMap = {}
    suggs.forEach(s => {
      PORTATE.forEach(p => { if (s[p]) initialAccepted[`${s.memberId}-${p}`] = true })
    })
    setAccepted(initialAccepted)
    setLoading(false)
  }, [dateParam])

  useEffect(() => { load() }, [load])

  const toggleAccepted = (memberId: string, portata: Portata) => {
    const key = `${memberId}-${portata}`
    setAccepted(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const countAccepted = () => Object.values(accepted).filter(Boolean).length

  const applySelected = async () => {
    setApplying(true)
    const date = new Date(dateParam + 'T12:00:00Z').toISOString()
    const promises: Promise<any>[] = []

    suggestions.forEach(s => {
      PORTATE.forEach(p => {
        const key = `${s.memberId}-${p}`
        if (accepted[key] && s[p]) {
          const ing = s[p]!
          promises.push(fetch('/api/planned-meals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date, slot: slotParam,
              memberGroup: s.memberId,
              mealOptionId: ing.id,
              notes: p,
              overrides: [],
            }),
          }))
          // Scala porzioni
          if (ing.totalServings > 0) {
            promises.push(fetch(`/api/ingredients/${ing.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ totalServings: Math.max(0, ing.totalServings - 1) }),
            }))
          }
        }
      })
    })

    await Promise.all(promises)
    setApplying(false)
    router.push('/planner')
  }

  if (loading) {
    return (
      <div className="px-4 pt-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="text-zinc-500 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-zinc-100">Suggerimenti</h1>
        </div>
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Analizzo dispensa e regole…</p>
        </div>
      </div>
    )
  }

  const allEmpty = suggestions.every(s => !s.primo && !s.secondo && !s.contorno)

  return (
    <div className="pb-32">
      <div className="px-4 pt-6 pb-4 sticky top-0 bg-zinc-950/95 backdrop-blur z-10 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-zinc-500 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Suggerimenti</h1>
            <p className="text-xs text-zinc-500">{slotParam === 'dinner' ? 'Cena' : 'Pranzo'} — tocca per accettare / rifiutare</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {allEmpty ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-3xl">🤔</p>
            <p className="text-sm text-zinc-400">Dispensa vuota o nessun ingrediente compatibile.</p>
            <button onClick={() => router.push('/pantry')} className="btn-primary px-6">
              Vai alla dispensa
            </button>
          </div>
        ) : (
          suggestions.map(s => (
            <div key={s.memberId} className="card-tight px-4 py-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-400/20 flex items-center justify-center text-sm">
                  {s.memberType === 'adult' ? '🧑' : '👶'}
                </div>
                <p className="text-sm font-bold text-zinc-100">{s.memberName}</p>
              </div>

              <div className="space-y-2">
                {PORTATE.map(p => {
                  const ing = s[p]
                  const key = `${s.memberId}-${p}`
                  const isAccepted = accepted[key]

                  if (!ing) {
                    return (
                      <div key={p} className="flex items-center gap-3 px-1">
                        <span className="text-xs text-zinc-700 w-16 flex-shrink-0">{PORTATA_LABEL[p]}</span>
                        <span className="text-xs text-zinc-700 italic">—</span>
                      </div>
                    )
                  }

                  return (
                    <button key={p} onClick={() => toggleAccepted(s.memberId, p)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                        isAccepted
                          ? 'bg-amber-400/10 border-amber-400/40'
                          : 'bg-zinc-800/30 border-zinc-800 opacity-50'
                      }`}>
                      <span className="text-xs text-zinc-500 w-14 flex-shrink-0 text-left">{PORTATA_LABEL[p]}</span>
                      <span className={`text-sm flex-1 text-left font-medium transition-all ${
                        isAccepted ? 'text-zinc-100' : 'text-zinc-600 line-through'
                      }`}>
                        {ing.name}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {ing.status === 'urgent' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-900/40 text-red-400">urgente</span>
                        )}
                        {ing.status === 'opened' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-900/30 text-amber-500">aperto</span>
                        )}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isAccepted ? 'bg-amber-400 border-amber-400' : 'border-zinc-600'
                        }`}>
                          {isAccepted && (
                            <svg className="w-3 h-3 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {s.notes.length > 0 && (
                <div className="mt-3 space-y-1 px-1">
                  {s.notes.map((n, i) => (
                    <p key={i} className="text-[11px] text-amber-400/70">⚠ {n}</p>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {!allEmpty && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-20">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3 shadow-xl">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-100">
                {countAccepted()} {countAccepted() === 1 ? 'voce selezionata' : 'voci selezionate'}
              </p>
              <p className="text-xs text-zinc-500 truncate">Tocca una voce per deselezionarla</p>
            </div>
            <button onClick={applySelected} disabled={countAccepted() === 0 || applying}
              className="btn-primary px-5 py-2.5 disabled:opacity-40 flex-shrink-0 whitespace-nowrap">
              {applying ? 'Applico…' : 'Applica'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
