import type {
  Ingredient,
  MealOption,
  FamilyMember,
  PlannedMeal,
  PlanningRule,
  SuggestionResult,
  ScoreBreakdown,
  DayConflict,
} from '@/lib/types'

// ─── Scoring Weights ─────────────────────────────────────────────────────────

const SCORE_WEIGHTS = {
  // Bonus
  OPENED_INGREDIENT: 30,
  EXPIRY_IMMINENT: 25,    // < 2 days
  HIGH_PERISHABILITY: 20, // score > 80
  URGENT_SIDE: 15,
  ALL_MEMBERS_COMPATIBLE: 10,
  NOT_REPEATED_RECENTLY: 5,
  // Penalties
  CHILDREN_PROTEIN_REPEAT: -30,
  FROZEN_BEFORE_FRESH: -25,
  INSUFFICIENT_SERVINGS: -20,
  OPENS_WHEN_ALTERNATIVE_EXISTS: -15,
  COMPLEX_EXCEPTIONS: -10,
  SAME_SAUCE_RECENTLY: -5,
}

// ─── Main Suggestion Function ─────────────────────────────────────────────────

export function rankDinnerSuggestions({
  mealOptions,
  ingredients,
  members,
  recentPlannedMeals,
  rules,
  targetDate,
  memberGroup,
}: {
  mealOptions: MealOption[]
  ingredients: Ingredient[]
  members: FamilyMember[]
  recentPlannedMeals: PlannedMeal[]
  rules: PlanningRule[]
  targetDate: Date
  memberGroup: 'adults' | 'children' | 'all'
}): SuggestionResult[] {
  const ingMap = new Map(ingredients.map((i) => [i.id, i]))
  const activeRules = new Set(rules.filter((r) => r.active).map((r) => r.key))
  const isChildrenGroup = memberGroup === 'children'
  const isAdultsGroup = memberGroup === 'adults'

  // Filter meal options by group relevance
  const eligible = mealOptions.filter((m) => {
    if (isChildrenGroup) return m.mealType === 'children_dinner' || m.mealType === 'universal'
    if (isAdultsGroup) return m.mealType === 'adult_dinner' || m.mealType === 'universal'
    return true
  })

  const results: SuggestionResult[] = eligible.map((meal) => {
    const breakdown: ScoreBreakdown[] = []
    let score = 50 // base

    const requiredIngs = meal.requiredIngredientIds
      .map((id) => ingMap.get(id))
      .filter(Boolean) as Ingredient[]

    // ── Ingredient availability check ────────────────────────────────────────
    const unavailableIngs = requiredIngs.filter(
      (ing) => ing.status === 'consumed' || ing.quantity <= 0
    )
    if (unavailableIngs.length > 0) {
      return {
        mealOption: meal,
        score: -1,
        breakdown: [{ factor: 'Ingrediente esaurito', delta: -100, reason: `Mancano: ${unavailableIngs.map((i) => i.name).join(', ')}` }],
        explanation: `Non disponibile: mancano ${unavailableIngs.map((i) => i.name).join(', ')}`,
        warnings: [],
      }
    }

    // ── Bonus: opened ingredients ────────────────────────────────────────────
    const openedIngs = requiredIngs.filter((ing) => ing.status === 'opened' || ing.status === 'urgent')
    if (openedIngs.length > 0) {
      const delta = SCORE_WEIGHTS.OPENED_INGREDIENT * openedIngs.length
      score += delta
      breakdown.push({
        factor: 'Ingrediente aperto',
        delta,
        reason: `${openedIngs.map((i) => i.name).join(', ')} ${openedIngs.length > 1 ? 'sono aperti' : 'è aperto'} e va consumato`,
      })
    }

    // ── Bonus: imminent expiry (< 48h) ───────────────────────────────────────
    const imminentIngs = requiredIngs.filter((ing) => {
      if (!ing.expiryDate) return false
      const diff = new Date(ing.expiryDate).getTime() - targetDate.getTime()
      return diff < 48 * 60 * 60 * 1000
    })
    if (imminentIngs.length > 0) {
      score += SCORE_WEIGHTS.EXPIRY_IMMINENT
      breakdown.push({
        factor: 'Scadenza imminente',
        delta: SCORE_WEIGHTS.EXPIRY_IMMINENT,
        reason: `${imminentIngs.map((i) => i.name).join(', ')} scade entro 48 ore`,
      })
    }

    // ── Bonus: high perishability ────────────────────────────────────────────
    const urgentPerishable = requiredIngs.filter((ing) => ing.perishabilityScore > 80 && ing.storageType === 'fresh')
    if (urgentPerishable.length > 0) {
      score += SCORE_WEIGHTS.HIGH_PERISHABILITY
      breakdown.push({
        factor: 'Alta deperibilità',
        delta: SCORE_WEIGHTS.HIGH_PERISHABILITY,
        reason: `${urgentPerishable.map((i) => i.name).join(', ')} è fresco e molto deperibile`,
      })
    }

    // ── Penalty: frozen before fresh ─────────────────────────────────────────
    const usesFrozen = requiredIngs.some((i) => i.storageType === 'freezer')
    const hasFreshUrgent = ingredients.some(
      (i) =>
        i.storageType === 'fresh' &&
        i.perishabilityScore > 60 &&
        i.status !== 'consumed' &&
        !requiredIngs.find((r) => r.id === i.id)
    )
    if (usesFrozen && hasFreshUrgent && activeRules.has('fresh_before_frozen')) {
      score += SCORE_WEIGHTS.FROZEN_BEFORE_FRESH
      breakdown.push({
        factor: 'Surgelato prima del fresco',
        delta: SCORE_WEIGHTS.FROZEN_BEFORE_FRESH,
        reason: 'Ci sono ingredienti freschi urgenti non ancora pianificati',
      })
    }

    // ── Penalty: children protein repeat ─────────────────────────────────────
    if (isChildrenGroup && activeRules.has('no_protein_repeat_children_consecutive')) {
      const yesterday = new Date(targetDate)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      const yesterdayChildrenMeal = recentPlannedMeals.find(
        (pm) =>
          pm.date.split('T')[0] === yesterdayStr &&
          pm.slot === 'dinner' &&
          pm.memberGroup === 'children'
      )
      if (yesterdayChildrenMeal && yesterdayChildrenMeal.mealOptionId === meal.id) {
        score += SCORE_WEIGHTS.CHILDREN_PROTEIN_REPEAT
        breakdown.push({
          factor: 'Ripetizione secondo bambini',
          delta: SCORE_WEIGHTS.CHILDREN_PROTEIN_REPEAT,
          reason: 'I bambini hanno mangiato lo stesso secondo ieri sera',
        })
      }
    }

    // ── Bonus: member compatibility ──────────────────────────────────────────
    const groupMembers = isChildrenGroup
      ? members.filter((m) => m.type === 'child')
      : isAdultsGroup
      ? members.filter((m) => m.type === 'adult')
      : members

    const allCompatible =
      meal.compatibleMemberIds.length === 0 ||
      groupMembers.every(
        (m) =>
          meal.compatibleMemberIds.includes(m.id) ||
          !meal.compatibleMemberIds.length
      )
    if (allCompatible && groupMembers.length > 1) {
      score += SCORE_WEIGHTS.ALL_MEMBERS_COMPATIBLE
      breakdown.push({
        factor: 'Compatibilità gruppo',
        delta: SCORE_WEIGHTS.ALL_MEMBERS_COMPATIBLE,
        reason: 'Tutti i membri del gruppo possono mangiare questo pasto',
      })
    }

    // ── Servings check ───────────────────────────────────────────────────────
    const warnings: string[] = []
    for (const ing of requiredIngs) {
      const neededServings = isChildrenGroup ? 2 : isAdultsGroup ? 2 : 4
      const availableServings = isChildrenGroup ? ing.servingsChildren : ing.servingsAdults
      if (availableServings < neededServings && neededServings > 0) {
        score += SCORE_WEIGHTS.INSUFFICIENT_SERVINGS
        breakdown.push({
          factor: 'Porzioni insufficienti',
          delta: SCORE_WEIGHTS.INSUFFICIENT_SERVINGS,
          reason: `${ing.name}: disponibili ${availableServings} porzioni, ne servono ${neededServings}`,
        })
        warnings.push(`${ing.name} potrebbe non bastare per tutto il gruppo`)
      }
    }

    // ── Build explanation ────────────────────────────────────────────────────
    const explanation = buildExplanation(meal, requiredIngs, breakdown, score)

    return {
      mealOption: meal,
      score,
      breakdown,
      explanation,
      warnings,
    }
  })

  return results
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8) // top 8
}

function buildExplanation(
  meal: MealOption,
  ingredients: Ingredient[],
  breakdown: ScoreBreakdown[],
  score: number
): string {
  const topReasons = breakdown
    .filter((b) => Math.abs(b.delta) >= 10)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 2)
    .map((b) => b.reason)

  if (topReasons.length === 0) {
    return `${meal.name} è una buona opzione con ingredienti disponibili.`
  }

  return topReasons.join('. ') + '.'
}

// ─── Conflict Detection ──────────────────────────────────────────────────────

export function detectConflictsInWeekPlan({
  plannedMeals,
  ingredients,
  members,
  rules,
}: {
  plannedMeals: PlannedMeal[]
  ingredients: Ingredient[]
  members: FamilyMember[]
  rules: PlanningRule[]
}): Map<string, DayConflict[]> {
  const conflicts = new Map<string, DayConflict[]>()
  const ingMap = new Map(ingredients.map((i) => [i.id, i]))
  const activeRules = new Set(rules.filter((r) => r.active).map((r) => r.key))

  // Group meals by date
  const byDate = new Map<string, PlannedMeal[]>()
  for (const pm of plannedMeals) {
    const dateKey = pm.date.split('T')[0]
    if (!byDate.has(dateKey)) byDate.set(dateKey, [])
    byDate.get(dateKey)!.push(pm)
  }

  const sortedDates = Array.from(byDate.keys()).sort()

  // Check ingredient used on multiple days
  const ingredientUsageDates = new Map<string, string[]>()
  for (const pm of plannedMeals) {
    const dateKey = pm.date.split('T')[0]
    // We'd need meal options here — simplified: track by mealOptionId patterns
  }

  // Check consecutive children protein repeat
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1]
    const currDate = sortedDates[i]

    // Check if consecutive
    const prev = new Date(prevDate)
    const curr = new Date(currDate)
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays !== 1) continue

    if (!activeRules.has('no_protein_repeat_children_consecutive')) continue

    const prevChildrenDinner = byDate.get(prevDate)?.find(
      (pm) => pm.slot === 'dinner' && pm.memberGroup === 'children'
    )
    const currChildrenDinner = byDate.get(currDate)?.find(
      (pm) => pm.slot === 'dinner' && pm.memberGroup === 'children'
    )

    if (
      prevChildrenDinner &&
      currChildrenDinner &&
      prevChildrenDinner.mealOptionId === currChildrenDinner.mealOptionId
    ) {
      const existing = conflicts.get(currDate) || []
      existing.push({
        type: 'children_protein_repeat',
        message: 'I bambini stanno mangiando lo stesso secondo due sere di fila',
        severity: 'warning',
        relatedMealId: currChildrenDinner.id,
      })
      conflicts.set(currDate, existing)
    }
  }

  return conflicts
}

// ─── Urgent Ingredients ──────────────────────────────────────────────────────

export function getUrgentIngredients(ingredients: Ingredient[]): Ingredient[] {
  const now = new Date()
  return ingredients
    .filter((i) => {
      if (i.status === 'consumed') return false
      if (i.status === 'opened' || i.status === 'urgent') return true
      if (i.expiryDate) {
        const diff = new Date(i.expiryDate).getTime() - now.getTime()
        if (diff < 72 * 60 * 60 * 1000) return true // < 3 days
      }
      if (i.perishabilityScore >= 80 && i.storageType === 'fresh') return true
      return false
    })
    .sort((a, b) => {
      // opened/urgent first, then by perishability
      const statusScore = (s: string) => (s === 'urgent' ? 3 : s === 'opened' ? 2 : 1)
      const diff = statusScore(b.status) - statusScore(a.status)
      if (diff !== 0) return diff
      return b.perishabilityScore - a.perishabilityScore
    })
}

// ─── Compatibility Helpers ───────────────────────────────────────────────────

export function getMealsCompatibleWithMember(
  meals: MealOption[],
  memberId: string,
  ingredients: Ingredient[]
): MealOption[] {
  const ingMap = new Map(ingredients.map((i) => [i.id, i]))
  return meals.filter((meal) => {
    // Check meal-level compatibility
    if (
      meal.compatibleMemberIds.length > 0 &&
      !meal.compatibleMemberIds.includes(memberId)
    ) {
      return false
    }
    // Check ingredient-level exclusions
    for (const ingId of meal.requiredIngredientIds) {
      const ing = ingMap.get(ingId)
      if (ing?.excludedMemberIds.includes(memberId)) return false
    }
    return true
  })
}

export function scoreIngredientUrgency(ingredient: Ingredient): number {
  let score = ingredient.perishabilityScore

  if (ingredient.status === 'urgent') score += 30
  if (ingredient.status === 'opened') score += 20
  if (ingredient.storageType === 'fresh') score += 10
  if (ingredient.expiryDate) {
    const diff = new Date(ingredient.expiryDate).getTime() - Date.now()
    const hoursLeft = diff / (1000 * 60 * 60)
    if (hoursLeft < 24) score += 40
    else if (hoursLeft < 48) score += 25
    else if (hoursLeft < 72) score += 10
  }
  return Math.min(score, 100)
}

export function getUnusedOpenIngredients(
  ingredients: Ingredient[],
  plannedMeals: PlannedMeal[],
  mealOptions: MealOption[]
): Ingredient[] {
  const usedIngredientIds = new Set<string>()
  const mealOptionMap = new Map(mealOptions.map((m) => [m.id, m]))

  for (const pm of plannedMeals) {
    const mealOption = mealOptionMap.get(pm.mealOptionId)
    if (mealOption) {
      mealOption.requiredIngredientIds.forEach((id) => usedIngredientIds.add(id))
    }
  }

  return ingredients.filter(
    (i) =>
      (i.status === 'opened' || i.status === 'urgent') &&
      !usedIngredientIds.has(i.id) &&
      i.status !== 'consumed'
  )
}
