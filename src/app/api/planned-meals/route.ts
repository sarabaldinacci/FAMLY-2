import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { parsePlannedMeal } from '@/lib/db/parsers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const where: any = {}
  if (from) where.date = { gte: new Date(from) }
  if (to) where.date = { ...where.date, lte: new Date(to + 'T23:59:59Z') }
  const raw = await prisma.plannedMeal.findMany({ where, orderBy: { date: 'asc' } })
  return NextResponse.json(raw.map(parsePlannedMeal))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const meal = await prisma.plannedMeal.create({
    data: {
      date: new Date(body.date),
      slot: body.slot ?? 'dinner',
      memberGroup: body.memberGroup ?? 'all',
      mealOptionId: body.mealOptionId,
      overrides: JSON.stringify(body.overrides ?? []),
      notes: body.notes ?? '',
    },
  })
  return NextResponse.json(parsePlannedMeal(meal), { status: 201 })
}
