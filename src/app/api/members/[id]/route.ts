import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { parseMember } from '@/lib/db/parsers'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.type !== undefined) data.type = body.type
  if (body.dietaryTags !== undefined) data.dietaryTags = JSON.stringify(body.dietaryTags)
  if (body.notes !== undefined) data.notes = body.notes
  if (body.excludedIngredientIds !== undefined) data.excludedIngredientIds = JSON.stringify(body.excludedIngredientIds)
  const updated = await prisma.familyMember.update({ where: { id: params.id }, data })
  return NextResponse.json(parseMember(updated))
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.familyMember.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
