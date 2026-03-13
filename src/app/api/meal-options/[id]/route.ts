import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.mealOption.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const updated = await prisma.mealOption.update({
    where: { id: params.id },
    data: body,
  })
  return NextResponse.json(updated)
}
