'use client'
import { useEffect, useState } from 'react'
import type { FamilyMember, PlanningRule } from '@/lib/types'

function MemberCard({ member }: { member: FamilyMember }) {
  const emoji = member.type === 'adult' ? '🧑' : '👶'
  const tags = member.dietaryTags ?? []
  return (
    <div className="card-tight px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xl flex-shrink-0">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-100">{member.name}</p>
        <p className="text-xs text-zinc-500 capitalize">{member.type === 'adult' ? 'Adulto' : 'Bambino'}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map(t => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{t}</span>
            ))}
          </div>
        )}
        {(member.excludedIngredientIds?.length ?? 0) > 0 && (
          <p className="text-[10px] text-red-400 mt-1">
            {member.excludedIngredientIds.length} ingrediente/i escluso/i
          </p>
        )}
        {member.notes && <p className="text-[11px] text-zinc-600 mt-1">{member.notes}</p>}
      </div>
    </div>
  )
}

function RuleRow({ rule, onToggle }: { rule: PlanningRule; onToggle: () => void }) {
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    await fetch(`/api/rules`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rule.id, active: !rule.active }),
    })
    onToggle()
    setLoading(false)
  }

  return (
    <div className="card-tight px-4 py-3 flex items-start gap-3">
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-medium text-zinc-200">{rule.label}</p>
        {rule.description && (
          <p className="text-xs text-zinc-500 mt-0.5">{rule.description}</p>
        )}
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${
          rule.scope === 'dinner' ? 'bg-blue-900/40 text-blue-400' :
          rule.scope === 'lunch' ? 'bg-green-900/40 text-green-400' :
          'bg-zinc-800 text-zinc-500'
        }`}>
          {rule.scope === 'dinner' ? 'Solo cena' : rule.scope === 'lunch' ? 'Solo pranzo' : 'Sempre'}
        </span>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 mt-0.5 ${
          rule.active ? 'bg-amber-400' : 'bg-zinc-700'
        }`}>
        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
          rule.active ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [rules, setRules] = useState<PlanningRule[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [mems, rls] = await Promise.all([
      fetch('/api/members').then(r => r.json()),
      fetch('/api/rules').then(r => r.json()),
    ])
    setMembers(mems)
    setRules(rls)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      <h1 className="text-xl font-bold text-zinc-100">Impostazioni</h1>

      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Famiglia</h2>
        <div className="space-y-2">
          {members.map(m => <MemberCard key={m.id} member={m} />)}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Regole di pianificazione</h2>
          <span className="text-xs text-zinc-600">{rules.filter(r => r.active).length}/{rules.length} attive</span>
        </div>
        <div className="space-y-2">
          {rules.map(r => <RuleRow key={r.id} rule={r} onToggle={load} />)}
        </div>
      </section>

      <div className="card-tight px-4 py-4 text-center">
        <p className="text-xs text-zinc-600">Famly v0.1 · Fatto per Sara, Davide, Diego e Bianca</p>
      </div>
    </div>
  )
}
