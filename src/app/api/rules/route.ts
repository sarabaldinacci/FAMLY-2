import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { parsePlanningRule } from '@/lib/db/parsers'

export async function GET() {
  const raw = await prisma.planningRule.findMany({ orderBy: { key: 'asc' } })
  return NextResponse.json(raw.map(parsePlanningRule))
}

export async function PATCH(req: NextRequest) {
  const { id, active } = await req.json()
  const updated = await prisma.planningRule.update({ where: { id }, data: { active } })
  return NextResponse.json(parsePlanningRule(updated))
}
