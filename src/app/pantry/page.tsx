'use client'
import { useEffect, useState, useCallback } from 'react'
import type { Ingredient, FamilyMember } from '@/lib/types'
import { calcServingsInfo, CATEGORY_LABELS, STORAGE_LABELS, STATUS_LABELS, STATUS_COLOR, STORAGE_COLOR, PERISHABILITY_LABEL, PERISHABILITY_COLOR } from '@/lib/types'

const FILTERS = [
  { key: 'all', label: 'Tutti' },
  { key: 'urgent', label: 'Urgenti' },
  { key: 'opened', label: 'Aperti' },
  { key: 'fresh', label: 'Freschi' },
  { key: 'freezer', label: 'Freezer' },
  { key: 'pantry', label: 'Dispensa' },
] as const

type FilterKey = typeof FILTERS[number]['key']

// ─── Servings Picker ────────────────────────────────────────────────────────
// Il componente chiave: "ho comprato 3 porzioni di petto di pollo, lo mangiano Sara, Diego, Bianca"

function ServingsPickerSheet({
  ing,
  members,
  onClose,
  onSaved,
}: {
  ing: Ingredient
  members: FamilyMember[]
  onClose: () => void
  onSaved: () => void
}) {
  const [totalServings, setTotalServings] = useState(ing.totalServings || 0)
  const [whoEatsIt, setWhoEatsIt] = useState<string[]>(
    ing.whoEatsIt.length > 0 ? ing.whoEatsIt : []
  )
  const [saving, setSaving] = useState(false)

  const toggleMember = (id: string) => {
    setWhoEatsIt(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const info = calcServingsInfo(
    { ...ing, totalServings, whoEatsIt },
    members
  )

  const save = async () => {
    setSaving(true)
    await fetch(`/api/ingredients/${ing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalServings, whoEatsIt }),
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
            <h2 className="font-bold text-zinc-100">{ing.name}</h2>
            <p className="text-xs text-zinc-500">Porzioni acquistate</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Numero porzioni */}
          <div>
            <label className="text-sm font-medium text-zinc-200 mb-3 block">
              Quante porzioni hai comprato?
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTotalServings(Math.max(0, totalServings - 1))}
                className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center text-xl text-zinc-300 active:bg-zinc-700 transition-colors font-light">
                −
              </button>
              <span className="text-3xl font-bold text-zinc-100 w-12 text-center tabular-nums">
                {totalServings}
              </span>
              <button
                onClick={() => setTotalServings(totalServings + 1)}
                className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center text-xl text-zinc-300 active:bg-zinc-700 transition-colors font-light">
                +
              </button>
              <span className="text-sm text-zinc-500 ml-1">porzioni</span>
            </div>
            <p className="text-xs text-zinc-600 mt-2">
              Es: hai comprato 3 petti di pollo → 3 porzioni
            </p>
          </div>

          {/* Chi lo mangia */}
          <div>
            <label className="text-sm font-medium text-zinc-200 mb-3 block">
              Chi lo mangia?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {members.map(m => {
                const selected = whoEatsIt.includes(m.id)
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors text-left ${
                      selected
                        ? 'bg-amber-400/20 border-amber-400/60 text-amber-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                      selected
                        ? 'bg-amber-400 text-zinc-950'
                        : m.type === 'adult' ? 'bg-zinc-700 text-zinc-400' : 'bg-zinc-700 text-zinc-400'
                    }`}>
                      {m.type === 'adult' ? '🧑' : '👶'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{m.name}</p>
                      <p className="text-[10px] leading-tight opacity-60">
                        {m.type === 'adult' ? 'Adulto' : 'Bambino'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview calcolo */}
          {totalServings > 0 && whoEatsIt.length > 0 && (
            <div className="bg-zinc-800 rounded-xl px-4 py-3">
              <p className="text-xs text-zinc-500 mb-1">Risultato</p>
              <p className="text-sm font-semibold text-amber-400">
                {info.mealsCount} {info.mealsCount === 1 ? 'cena' : 'cene'}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{info.description}</p>
            </div>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="btn-primary w-full">
            {saving ? 'Salvo...' : 'Salva porzioni'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Ingredient Card ─────────────────────────────────────────────────────────

function IngredientCard({
  ing,
  members,
  onUpdate,
}: {
  ing: Ingredient
  members: FamilyMember[]
  onUpdate: () => void
}) {
  const [updating, setUpdating] = useState(false)
  const [showServings, setShowServings] = useState(false)

  const setStatus = async (status: string) => {
    setUpdating(true)
    await fetch(`/api/ingredients/${ing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    onUpdate()
    setUpdating(false)
  }

  const servingsInfo = ing.totalServings > 0
    ? calcServingsInfo(ing, members)
    : null

  const eaterNames = ing.whoEatsIt.length > 0
    ? ing.whoEatsIt.map(id => members.find(m => m.id === id)?.name).filter(Boolean).join(', ')
    : null

  return (
    <>
      <div className="card-tight px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-100">{ing.name}</span>
              {(ing.status === 'opened' || ing.status === 'urgent') && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
              )}
            </div>

            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className={`badge ${STORAGE_COLOR[ing.storageType]}`}>
                {STORAGE_LABELS[ing.storageType]}
              </span>
              <span className="badge bg-zinc-800 text-zinc-400">
                {CATEGORY_LABELS[ing.category]}
              </span>
              {ing.perishabilityScore > 60 && (
                <span className={`badge ${PERISHABILITY_COLOR(ing.perishabilityScore)}`}>
                  {PERISHABILITY_LABEL(ing.perishabilityScore)} deperibilità
                </span>
              )}
              <span className={`badge border ${STATUS_COLOR[ing.status]}`}>
                {STATUS_LABELS[ing.status]}
              </span>
            </div>

            {/* Servings info */}
            {servingsInfo && (
              <div className="mt-2 bg-zinc-800/60 rounded-lg px-2.5 py-1.5">
                <p className="text-xs font-semibold text-amber-400">
                  {servingsInfo.mealsCount} {servingsInfo.mealsCount === 1 ? 'cena' : 'cene'}
                </p>
                <p className="text-[11px] text-zinc-500">{servingsInfo.description}</p>
              </div>
            )}

            {!servingsInfo && ing.category === 'protein' && (
              <button
                onClick={() => setShowServings(true)}
                className="mt-2 text-xs text-amber-400/70 underline underline-offset-2">
                + Aggiungi porzioni
              </button>
            )}

            <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
              <span>{ing.quantity} {ing.unit}</span>
              {eaterNames && <><span>·</span><span>{eaterNames}</span></>}
              {ing.expiryDate && (
                <>
                  <span>·</span>
                  <span className={new Date(ing.expiryDate) < new Date(Date.now() + 3 * 86400000) ? 'text-red-400' : ''}>
                    Scade {new Date(ing.expiryDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  </span>
                </>
              )}
            </div>

            {ing.consumeInOneSession && (
              <p className="text-xs text-amber-400/80 mt-1">Da finire in un solo pasto</p>
            )}
          </div>

          {/* Edit servings button */}
          <button
            onClick={() => setShowServings(true)}
            className="text-zinc-600 active:text-amber-400 p-1.5 transition-colors flex-shrink-0"
            title="Modifica porzioni">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        {/* Quick status actions */}
        <div className="flex gap-2 mt-3">
          {ing.status === 'closed' && (
            <button onClick={() => setStatus('opened')} disabled={updating}
              className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 active:bg-amber-500/30 transition-colors">
              Segna aperto
            </button>
          )}
          {(ing.status === 'opened' || ing.status === 'urgent') && (
            <button onClick={() => setStatus('consumed')} disabled={updating}
              className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-zinc-800 text-zinc-400 active:bg-zinc-700 transition-colors">
              Finito
            </button>
          )}
          {ing.status === 'closed' && (
            <button onClick={() => setStatus('urgent')} disabled={updating}
              className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 active:bg-red-500/30 transition-colors">
              Urgente
            </button>
          )}
        </div>
      </div>

      {showServings && (
        <ServingsPickerSheet
          ing={ing}
          members={members}
          onClose={() => setShowServings(false)}
          onSaved={onUpdate}
        />
      )}
    </>
  )
}

// ─── Add Ingredient Sheet ────────────────────────────────────────────────────

function AddIngredientSheet({
  members,
  onClose,
  onAdded,
}: {
  members: FamilyMember[]
  onClose: () => void
  onAdded: () => void
}) {
  const [form, setForm] = useState({
    name: '', category: 'protein', storageType: 'fresh',
    quantity: 1, unit: 'pz', perishabilityScore: 50,
    status: 'closed', servingsAdults: 2, servingsChildren: 2,
    totalServings: 0, whoEatsIt: [] as string[],
    consumeInOneSession: false, notes: '',
  })
  const [saving, setSaving] = useState(false)

  const toggleMember = (id: string) => {
    setForm(f => ({
      ...f,
      whoEatsIt: f.whoEatsIt.includes(id)
        ? f.whoEatsIt.filter(x => x !== id)
        : [...f.whoEatsIt, id],
    }))
  }

  const preview = form.totalServings > 0 && form.whoEatsIt.length > 0
    ? calcServingsInfo(
        { ...form, id: '', name: form.name, category: form.category as any, storageType: form.storageType as any, status: form.status as any, allowedMemberIds: [], excludedMemberIds: [], expiryDate: null, purchaseDate: null, createdAt: '', updatedAt: '' },
        members
      )
    : null

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await fetch('/api/ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, allowedMemberIds: [], excludedMemberIds: [] }),
    })
    setSaving(false)
    onAdded()
    onClose()
  }

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="font-bold text-zinc-100">Nuovo ingrediente</h2>
          <button onClick={onClose} className="text-zinc-500 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Nome</label>
            <input className="input-field" placeholder="es. Petto di pollo" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Categoria</label>
              <select className="select-field" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="protein">Proteina</option>
                <option value="side">Contorno</option>
                <option value="primo">Primo</option>
                <option value="sauce">Sugo</option>
                <option value="dairy">Latticino</option>
                <option value="jolly">Jolly</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Dove si trova</label>
              <select className="select-field" value={form.storageType}
                onChange={e => setForm(f => ({ ...f, storageType: e.target.value }))}>
                <option value="fresh">Fresco</option>
                <option value="freezer">Freezer</option>
                <option value="pantry">Dispensa</option>
              </select>
            </div>
          </div>

          {/* Porzioni — sezione chiave */}
          <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-zinc-200">Porzioni acquistate</p>
            <div className="flex items-center gap-4">
              <button onClick={() => setForm(f => ({ ...f, totalServings: Math.max(0, f.totalServings - 1) }))}
                className="w-10 h-10 rounded-xl bg-zinc-700 flex items-center justify-center text-lg text-zinc-300 active:bg-zinc-600">−</button>
              <span className="text-2xl font-bold text-zinc-100 w-10 text-center tabular-nums">{form.totalServings}</span>
              <button onClick={() => setForm(f => ({ ...f, totalServings: f.totalServings + 1 }))}
                className="w-10 h-10 rounded-xl bg-zinc-700 flex items-center justify-center text-lg text-zinc-300 active:bg-zinc-600">+</button>
              <span className="text-sm text-zinc-500">porzioni</span>
            </div>

            {form.totalServings > 0 && (
              <>
                <p className="text-xs text-zinc-500">Chi lo mangia?</p>
                <div className="grid grid-cols-2 gap-2">
                  {members.map(m => {
                    const sel = form.whoEatsIt.includes(m.id)
                    return (
                      <button key={m.id} onClick={() => toggleMember(m.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-colors ${
                          sel ? 'bg-amber-400/20 border-amber-400/60 text-amber-300' : 'bg-zinc-700 border-zinc-600 text-zinc-400'
                        }`}>
                        <span>{m.type === 'adult' ? '🧑' : '👶'}</span>
                        <span className="font-medium">{m.name}</span>
                      </button>
                    )
                  })}
                </div>
                {preview && (
                  <div className="bg-zinc-900 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-400 font-semibold">{preview.mealsCount} {preview.mealsCount === 1 ? 'cena' : 'cene'}</p>
                    <p className="text-[11px] text-zinc-500">{preview.description}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Quantità</label>
              <input className="input-field" type="number" min="0" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Unità</label>
              <input className="input-field" placeholder="pz / g / kg" value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Stato</label>
            <select className="select-field" value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="closed">Chiuso</option>
              <option value="opened">Aperto</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Deperibilità: {form.perishabilityScore < 40 ? 'Bassa' : form.perishabilityScore < 70 ? 'Media' : 'Alta'}
            </label>
            <input type="range" min="0" max="100" value={form.perishabilityScore}
              className="w-full accent-amber-400"
              onChange={e => setForm(f => ({ ...f, perishabilityScore: parseInt(e.target.value) }))} />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-10 h-6 rounded-full transition-colors relative ${form.consumeInOneSession ? 'bg-amber-400' : 'bg-zinc-700'}`}
              onClick={() => setForm(f => ({ ...f, consumeInOneSession: !f.consumeInOneSession }))}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${form.consumeInOneSession ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-zinc-300">Va finito in un solo pasto</span>
          </label>

          <button onClick={save} disabled={saving || !form.name.trim()} className="btn-primary w-full">
            {saving ? 'Salvo...' : 'Aggiungi ingrediente'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PantryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [filter, setFilter] = useState<FilterKey>('all')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [ings, mems] = await Promise.all([
      fetch('/api/ingredients').then(r => r.json()),
      fetch('/api/members').then(r => r.json()),
    ])
    setIngredients(ings)
    setMembers(mems)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = ingredients.filter(ing => {
    const matchSearch = !search || ing.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'urgent' && (ing.status === 'urgent' || ing.perishabilityScore > 80)) ||
      (filter === 'opened' && ing.status === 'opened') ||
      (filter === 'fresh' && ing.storageType === 'fresh') ||
      (filter === 'freezer' && ing.storageType === 'freezer') ||
      (filter === 'pantry' && ing.storageType === 'pantry')
    return matchSearch && matchFilter
  })

  return (
    <div className="pb-4">
      <div className="px-4 pt-6 pb-3 sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-zinc-100">Dispensa</h1>
          <button onClick={() => setShowAdd(true)} className="bg-amber-400 text-zinc-950 font-semibold text-sm px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
            + Aggiungi
          </button>
        </div>
        <input className="input-field mb-3" placeholder="Cerca ingrediente..." value={search}
          onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                filter === f.key ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-zinc-400 active:bg-zinc-700'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2 mt-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-600">
            <p className="text-sm">{search ? 'Nessun ingrediente trovato' : 'Nessun ingrediente in questa categoria'}</p>
          </div>
        ) : (
          filtered.map(ing => (
            <IngredientCard key={ing.id} ing={ing} members={members} onUpdate={load} />
          ))
        )}
      </div>

      {showAdd && (
        <AddIngredientSheet members={members} onClose={() => setShowAdd(false)} onAdded={load} />
      )}
    </div>
  )
}
