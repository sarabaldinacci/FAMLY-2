'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { SuggestionResult } from '@/lib/types'

export default function SuggestPage() {
  const [suggestions, setSuggestions] = useState<SuggestionResult[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    fetch(`/api/suggestions?date=${today}&group=all`)
      .then(r => r.json())
      .then(data => {
        setSuggestions(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const useMeal = async (s: SuggestionResult) => {
    setSaving(s.mealOption.id)
    const today = new Date().toISOString()
    await fetch('/api/planned-meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: today,
        slot: 'dinner',
        memberGroup: 'all',
        mealOptionId: s.mealOption.id,
      }),
    })
    setSaved(s.mealOption.id)
    setSaving(null)
  }

  if (loading) {
    return (
      <div className="px-4 pt-8 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/planner" className="text-zinc-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-zinc-100">Suggerimenti cena</h1>
        </div>
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-center text-sm text-zinc-500">Analizzo la dispensa…</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/planner" className="text-zinc-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-zinc-100">Suggerimenti cena</h1>
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-3xl">🤔</p>
          <p className="text-sm text-zinc-400">Nessun suggerimento disponibile.<br />Aggiungi ingredienti alla dispensa.</p>
          <Link href="/pantry" className="btn-primary inline-block px-6 mt-2">Vai alla dispensa</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.slice(0, 5).map((s, i) => {
            const isSaved = saved === s.mealOption.id
            const isSaving = saving === s.mealOption.id

            return (
              <div key={s.mealOption.id} className="card-tight px-4 py-4 space-y-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-zinc-100">{s.mealOption.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{s.explanation}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-amber-400">{s.score}</p>
                    <p className="text-[10px] text-zinc-600">punteggio</p>
                  </div>
                </div>

                {/* Score bar */}
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${Math.min(s.score, 100)}%` }} />
                </div>

                {/* Breakdown pills */}
                {s.breakdown?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {s.breakdown.slice(0, 4).map((b, j) => (
                      <span key={j} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        b.delta > 0
                          ? 'bg-green-900/40 text-green-400'
                          : 'bg-red-900/40 text-red-400'
                      }`}>
                        {b.delta > 0 ? '+' : ''}{b.delta} {b.reason}
                      </span>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {s.warnings?.map((w, j) => (
                  <p key={j} className="text-xs text-amber-400/80">⚠ {w}</p>
                ))}

                {/* CTA */}
                <button onClick={() => useMeal(s)} disabled={!!saving || isSaved}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isSaved
                      ? 'bg-green-900/40 text-green-400 border border-green-500/30'
                      : 'btn-primary'
                  }`}>
                  {isSaved ? '✓ Aggiunto al planner' : isSaving ? 'Salvo…' : 'Usa stasera'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
