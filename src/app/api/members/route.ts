import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { parseMember } from '@/lib/db/parsers'

export async function GET() {
  const raw = await prisma.familyMember.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(raw.map(parseMember))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const member = await prisma.familyMember.create({
    data: {
      name: body.name,
      type: body.type ?? 'adult',
      dietaryTags: JSON.stringify(body.dietaryTags ?? []),
      allowedIngredientIds: JSON.stringify(body.allowedIngredientIds ?? []),
      excludedIngredientIds: JSON.stringify(body.excludedIngredientIds ?? []),
      notes: body.notes ?? '',
    },
  })
  return NextResponse.json(parseMember(member), { status: 201 })
}
