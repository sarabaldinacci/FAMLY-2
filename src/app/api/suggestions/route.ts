import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { parseIngredient, parseMealOption } from '@/lib/db/parsers'

export async function GET(req: NextRequest) {
  try {
    const ingredients = await prisma.ingredient.findMany({ where: { status: { not: 'consumed' } } })
    const mealOptions = await prisma.mealOption.findMany()

    const parsedIngredients = ingredients.map(parseIngredient)
    const parsedMeals = mealOptions.map(parseMealOption)

    // Simple scoring: prioritize meals we have ingredients for, boost urgent/opened
    const scored = parsedMeals.map(meal => {
      let score = 50
      const breakdown: { factor: string; delta: number; reason: string }[] = []
      const warnings: string[] = []

      // Check if we have urgent/opened ingredients
      const urgentCount = parsedIngredients.filter(i => i.status === 'urgent' || i.status === 'opened').length
      if (urgentCount > 0) {
        const delta = Math.min(urgentCount * 10, 30)
        score += delta
        breakdown.push({ factor: 'urgent', delta, reason: `${urgentCount} ingredient/i da usare` })
      }

      // Prefer fresh over frozen
      const freshCount = parsedIngredients.filter(i => i.storageType === 'fresh').length
      if (freshCount > 0) {
        score += 10
        breakdown.push({ factor: 'fresh', delta: 10, reason: 'Ingredienti freschi disponibili' })
      }

      // Random variety factor
      const variety = Math.floor(Math.random() * 20) - 10
      score += variety

      const explanation = urgentCount > 0
        ? `Consigliato: hai ${urgentCount} ingredient/i aperti o urgenti da consumare.`
        : 'Buona opzione per stasera.'

      return { mealOption: meal, score: Math.max(0, Math.min(100, score)), breakdown, explanation, warnings }
    })

    const sorted = scored.sort((a, b) => b.score - a.score)
    return NextResponse.json(sorted.slice(0, 8))
  } catch (e) {
    console.error(e)
    return NextResponse.json([])
  }
}
