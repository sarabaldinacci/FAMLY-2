import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { parseIngredient } from '@/lib/db/parsers'

export async function GET() {
  try {
    const raw = await prisma.ingredient.findMany({
      where: { status: { not: 'consumed' } },
      orderBy: [{ status: 'asc' }, { perishabilityScore: 'desc' }],
    })
    return NextResponse.json(raw.map(parseIngredient))
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch ingredients' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ingredient = await prisma.ingredient.create({
      data: {
        name: body.name,
        category: body.category ?? 'protein',
        storageType: body.storageType ?? 'fresh',
        quantity: body.quantity ?? 1,
        unit: body.unit ?? 'pz',
        perishabilityScore: body.perishabilityScore ?? 50,
        status: body.status ?? 'closed',
        servingsAdults: body.servingsAdults ?? 2,
        servingsChildren: body.servingsChildren ?? 2,
        totalServings: body.totalServings ?? 0,
        whoEatsIt: JSON.stringify(body.whoEatsIt ?? []),
        consumeInOneSession: body.consumeInOneSession ?? false,
        notes: body.notes ?? '',
        allowedMemberIds: JSON.stringify(body.allowedMemberIds ?? []),
        excludedMemberIds: JSON.stringify(body.excludedMemberIds ?? []),
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      },
    })
    return NextResponse.json(parseIngredient(ingredient), { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create ingredient' }, { status: 500 })
  }
}
