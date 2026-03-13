import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { parseMealOption } from '@/lib/db/parsers'

export async function GET() {
  const raw = await prisma.mealOption.findMany({ orderBy: { mealType: 'asc' } })
  return NextResponse.json(raw.map(parseMealOption))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const meal = await prisma.mealOption.create({
    data: {
      name: body.name,
      mealType: body.mealType ?? 'universal',
      compatibleMemberIds: JSON.stringify(body.compatibleMemberIds ?? []),
      requiredIngredientIds: JSON.stringify(body.requiredIngredientIds ?? []),
      optionalIngredientIds: JSON.stringify(body.optionalIngredientIds ?? []),
      servingsAdults: body.servingsAdults ?? 2,
      servingsChildren: body.servingsChildren ?? 2,
      tags: JSON.stringify(body.tags ?? []),
      canBeFrozen: body.canBeFrozen ?? false,
      preparationNotes: body.preparationNotes ?? '',
    },
  })
  return NextResponse.json(parseMealOption(meal), { status: 201 })
}
