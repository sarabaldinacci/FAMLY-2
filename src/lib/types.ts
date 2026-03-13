// ─── Core Types ─────────────────────────────────────────────────────────────

export type MemberType = 'adult' | 'child'
export type IngredientCategory = 'protein' | 'side' | 'primo' | 'sauce' | 'jolly' | 'dairy'
export type StorageType = 'fresh' | 'freezer' | 'pantry'
export type IngredientStatus = 'closed' | 'opened' | 'urgent' | 'consumed'
export type MealSlot = 'lunch' | 'dinner'
export type MealType =
  | 'adult_dinner'
  | 'children_dinner'
  | 'adult_lunch'
  | 'children_lunch'
  | 'universal'

export interface FamilyMember {
  id: string
  name: string
  type: MemberType
  dietaryTags: string[]
  allowedIngredientIds: string[]
  excludedIngredientIds: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Ingredient {
  id: string
  name: string
  category: IngredientCategory
  storageType: StorageType
  quantity: number
  unit: string
  purchaseDate?: string | null
  expiryDate?: string | null
  perishabilityScore: number
  status: IngredientStatus
  allowedMemberIds: string[]
  excludedMemberIds: string[]
  servingsAdults: number
  servingsChildren: number
  totalServings: number       // porzioni totali acquistate (es. 3 petti di pollo)
  whoEatsIt: string[]         // memberIds — chi lo mangia
  consumeInOneSession: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

// Calcola quante cene copre un ingrediente dato chi lo mangia
export function calcServingsInfo(
  ing: Ingredient,
  members: { id: string; name: string; type: string }[]
): { mealsCount: number; description: string } {
  if (ing.totalServings <= 0) {
    return { mealsCount: 1, description: '' }
  }

  const eaterIds = ing.whoEatsIt.length > 0 ? ing.whoEatsIt : members.map(m => m.id)
  const eaters = eaterIds
    .map(id => members.find(m => m.id === id))
    .filter(Boolean) as { id: string; name: string; type: string }[]

  if (eaters.length === 0) return { mealsCount: 1, description: '' }

  const mealsCount = Math.floor(ing.totalServings / eaters.length)
  const names = eaters.map(e => e.name).join(', ')

  return {
    mealsCount,
    description: `${ing.totalServings} porzioni ÷ ${eaters.length} (${names}) = ${mealsCount} cene`,
  }
}

export interface MealOption {
  id: string
  name: string
  mealType: MealType
  compatibleMemberIds: string[]
  requiredIngredientIds: string[]
  optionalIngredientIds: string[]
  servingsAdults: number
  servingsChildren: number
  tags: string[]
  canBeFrozen: boolean
  preparationNotes: string
  createdAt: string
  updatedAt: string
}

export interface PlanningRule {
  id: string
  key: string
  label: string
  value: boolean | number | string
  scope: 'dinner' | 'lunch' | 'always'
  active: boolean
  description: string
  createdAt: string
  updatedAt: string
}

export interface MemberOverride {
  memberId: string
  mealOptionId: string
  reason: string
}

export interface PlannedMeal {
  id: string
  date: string
  slot: MealSlot
  memberGroup: 'adults' | 'children' | 'all' | string
  mealOptionId: string
  overrides: MemberOverride[]
  notes: string
  createdAt: string
  updatedAt: string
}

// ─── Engine Types ────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  factor: string
  delta: number
  reason: string
}

export interface SuggestionResult {
  mealOption: MealOption
  score: number
  breakdown: ScoreBreakdown[]
  explanation: string
  warnings: string[]
}

export interface DayConflict {
  type: 'missing_ingredient' | 'insufficient_servings' | 'ingredient_already_used' | 'children_protein_repeat' | 'frozen_before_fresh' | 'opened_not_used'
  message: string
  severity: 'error' | 'warning' | 'info'
  relatedIngredientId?: string
  relatedMealId?: string
}

// ─── Label / Color helpers ───────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  protein: 'Proteina',
  side: 'Contorno',
  primo: 'Primo',
  sauce: 'Sugo',
  jolly: 'Jolly',
  dairy: 'Latticino',
}

export const STORAGE_LABELS: Record<StorageType, string> = {
  fresh: 'Fresco',
  freezer: 'Freezer',
  pantry: 'Dispensa',
}

export const STATUS_LABELS: Record<IngredientStatus, string> = {
  closed: 'Chiuso',
  opened: 'Aperto',
  urgent: 'Urgente',
  consumed: 'Finito',
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  adult_dinner: 'Cena adulti',
  children_dinner: 'Cena bambini',
  adult_lunch: 'Pranzo adulti',
  children_lunch: 'Pranzo bambini',
  universal: 'Universale',
}

export const PERISHABILITY_LABEL = (score: number): string => {
  if (score >= 80) return 'Alta'
  if (score >= 50) return 'Media'
  return 'Bassa'
}

export const PERISHABILITY_COLOR = (score: number): string => {
  if (score >= 80) return 'text-red-600 bg-red-50'
  if (score >= 50) return 'text-amber-600 bg-amber-50'
  return 'text-green-600 bg-green-50'
}

export const STATUS_COLOR: Record<IngredientStatus, string> = {
  opened: 'text-red-700 bg-red-50 border-red-200',
  urgent: 'text-red-800 bg-red-100 border-red-300',
  closed: 'text-slate-600 bg-slate-50 border-slate-200',
  consumed: 'text-slate-400 bg-slate-50 border-slate-100',
}

export const STORAGE_COLOR: Record<StorageType, string> = {
  fresh: 'text-emerald-700 bg-emerald-50',
  freezer: 'text-blue-700 bg-blue-50',
  pantry: 'text-amber-700 bg-amber-50',
}
