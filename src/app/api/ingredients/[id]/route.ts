import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { parseIngredient } from '@/lib/db/parsers'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const raw = await prisma.ingredient.findUnique({ where: { id } })
  if (!raw) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(parseIngredient(raw))
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.status !== undefined) data.status = body.status
  if (body.quantity !== undefined) data.quantity = body.quantity
  if (body.totalServings !== undefined) data.totalServings = body.totalServings
  if (body.whoEatsIt !== undefined) data.whoEatsIt = JSON.stringify(body.whoEatsIt)
  if (body.expiryDate !== undefined) data.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null
  if (body.perishabilityScore !== undefined) data.perishabilityScore = body.perishabilityScore
  if (body.notes !== undefined) data.notes = body.notes
  if (body.consumeInOneSession !== undefined) data.consumeInOneSession = body.consumeInOneSession
  if (body.storageType !== undefined) data.storageType = body.storageType
  if (body.category !== undefined) data.category = body.category
  const updated = await prisma.ingredient.update({ where: { id }, data })
  return NextResponse.json(parseIngredient(updated))
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.ingredient.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
