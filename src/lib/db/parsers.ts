import type { FamilyMember, Ingredient, MealOption, PlanningRule, PlannedMeal } from '@/lib/types'

export function parseMember(raw: any): FamilyMember {
  return {
    ...raw,
    dietaryTags: safeJsonParse(raw.dietaryTags, []),
    allowedIngredientIds: safeJsonParse(raw.allowedIngredientIds, []),
    excludedIngredientIds: safeJsonParse(raw.excludedIngredientIds, []),
    createdAt: raw.createdAt?.toISOString?.() ?? raw.createdAt,
    updatedAt: raw.updatedAt?.toISOString?.() ?? raw.updatedAt,
  }
}

export function parseIngredient(raw: any): Ingredient {
  return {
    ...raw,
    allowedMemberIds: safeJsonParse(raw.allowedMemberIds, []),
    excludedMemberIds: safeJsonParse(raw.excludedMemberIds, []),
    whoEatsIt: safeJsonParse(raw.whoEatsIt ?? '[]', []),
    totalServings: raw.totalServings ?? 0,
    purchaseDate: raw.purchaseDate?.toISOString?.() ?? raw.purchaseDate ?? null,
    expiryDate: raw.expiryDate?.toISOString?.() ?? raw.expiryDate ?? null,
    createdAt: raw.createdAt?.toISOString?.() ?? raw.createdAt,
    updatedAt: raw.updatedAt?.toISOString?.() ?? raw.updatedAt,
  }
}

export function parseMealOption(raw: any): MealOption {
  return {
    ...raw,
    compatibleMemberIds: safeJsonParse(raw.compatibleMemberIds, []),
    requiredIngredientIds: safeJsonParse(raw.requiredIngredientIds, []),
    optionalIngredientIds: safeJsonParse(raw.optionalIngredientIds, []),
    tags: safeJsonParse(raw.tags, []),
    createdAt: raw.createdAt?.toISOString?.() ?? raw.createdAt,
    updatedAt: raw.updatedAt?.toISOString?.() ?? raw.updatedAt,
  }
}

export function parsePlanningRule(raw: any): PlanningRule {
  return {
    ...raw,
    value: safeJsonParse(raw.value, raw.value),
    createdAt: raw.createdAt?.toISOString?.() ?? raw.createdAt,
    updatedAt: raw.updatedAt?.toISOString?.() ?? raw.updatedAt,
  }
}

export function parsePlannedMeal(raw: any): PlannedMeal {
  return {
    ...raw,
    overrides: safeJsonParse(raw.overrides, []),
    date: raw.date?.toISOString?.() ?? raw.date,
    createdAt: raw.createdAt?.toISOString?.() ?? raw.createdAt,
    updatedAt: raw.updatedAt?.toISOString?.() ?? raw.updatedAt,
  }
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try { return JSON.parse(value) as T }
  catch { return fallback }
}
