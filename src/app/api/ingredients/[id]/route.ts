import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { parseIngredient } from '@/lib/db/parsers'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const raw = await prisma.ingredient.findUnique({ where: { id: params.id } })
  if (!raw) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(parseIngredient(raw))
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const data: any = {}
    // Only update fields that are present in the request body
    if (body.name !== undefined) data.name = body.name
    if (body.status !== undefined) data.status = body.status
    if (body.quantity !== undefined) data.quantity = body.quantity
    if (body.totalServings !== undefined) data.totalServings = body.totalServings
    if (body.whoEatsIt !== undefined) data.whoEatsIt = JSON.stringify(body.whoEatsIt)
    if (body.allowedMemberIds !== undefined) data.allowedMemberIds = JSON.stringify(body.allowedMemberIds)
    if (body.excludedMemberIds !== undefined) data.excludedMemberIds = JSON.stringify(body.excludedMemberIds)
    if (body.expiryDate !== undefined) data.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null
    if (body.purchaseDate !== undefined) data.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null
    if (body.perishabilityScore !== undefined) data.perishabilityScore = body.perishabilityScore
    if (body.notes !== undefined) data.notes = body.notes
    if (body.consumeInOneSession !== undefined) data.consumeInOneSession = body.consumeInOneSession
    if (body.storageType !== undefined) data.storageType = body.storageType
    if (body.category !== undefined) data.category = body.category

    const updated = await prisma.ingredient.update({ where: { id: params.id }, data })
    return NextResponse.json(parseIngredient(updated))
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.ingredient.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
