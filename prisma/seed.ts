import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ─── MEMBERS ────────────────────────────────────────────────────────────────
  await prisma.familyMember.upsert({
    where: { id: 'member-sara' },
    update: {},
    create: {
      id: 'member-sara',
      name: 'Sara',
      type: 'adult',
      dietaryTags: JSON.stringify(['light', 'pesce']),
      allowedIngredientIds: JSON.stringify([]),
      excludedIngredientIds: JSON.stringify([]),
      notes: 'Preferenza dieta leggera. Mangia pesce e carne.',
    },
  })

  await prisma.familyMember.upsert({
    where: { id: 'member-davide' },
    update: {},
    create: {
      id: 'member-davide',
      name: 'Davide',
      type: 'adult',
      dietaryTags: JSON.stringify(['vegetariano']),
      allowedIngredientIds: JSON.stringify([]),
      excludedIngredientIds: JSON.stringify([]),
      notes: 'Vegetariano. No carne, no pesce.',
    },
  })

  await prisma.familyMember.upsert({
    where: { id: 'member-diego' },
    update: {},
    create: {
      id: 'member-diego',
      name: 'Diego',
      type: 'child',
      dietaryTags: JSON.stringify([]),
      allowedIngredientIds: JSON.stringify([]),
      excludedIngredientIds: JSON.stringify([]),
      notes: 'Mangia bresaola, insalata, tonno.',
    },
  })

  await prisma.familyMember.upsert({
    where: { id: 'member-bianca' },
    update: {},
    create: {
      id: 'member-bianca',
      name: 'Bianca',
      type: 'child',
      dietaryTags: JSON.stringify([]),
      allowedIngredientIds: JSON.stringify([]),
      excludedIngredientIds: JSON.stringify(['ing-bresaola']),
      notes: 'No bresaola.',
    },
  })

  console.log('✓ Members seeded')

  // ─── INGREDIENTS ────────────────────────────────────────────────────────────
  const now = new Date()
  const in2days = new Date(now.getTime() + 2 * 86400000)
  const in5days = new Date(now.getTime() + 5 * 86400000)
  const in10days = new Date(now.getTime() + 10 * 86400000)

  const ingredients = [
    {
      id: 'ing-pollo',
      name: 'Petto di pollo',
      category: 'protein',
      storageType: 'fresh',
      quantity: 3,
      unit: 'pz',
      perishabilityScore: 85,
      status: 'closed',
      totalServings: 3,
      whoEatsIt: JSON.stringify(['member-sara', 'member-diego', 'member-bianca']),
      expiryDate: in2days,
      servingsAdults: 1,
      servingsChildren: 1,
    },
    {
      id: 'ing-bresaola',
      name: 'Bresaola',
      category: 'protein',
      storageType: 'fresh',
      quantity: 1,
      unit: 'confezione',
      perishabilityScore: 75,
      status: 'opened',
      totalServings: 2,
      whoEatsIt: JSON.stringify(['member-sara', 'member-diego']),
      expiryDate: in5days,
      servingsAdults: 1,
      servingsChildren: 1,
      consumeInOneSession: true,
    },
    {
      id: 'ing-salmone',
      name: 'Salmone',
      category: 'protein',
      storageType: 'freezer',
      quantity: 2,
      unit: 'filetti',
      perishabilityScore: 40,
      status: 'closed',
      totalServings: 2,
      whoEatsIt: JSON.stringify(['member-sara', 'member-davide']),
      servingsAdults: 1,
      servingsChildren: 0,
    },
    {
      id: 'ing-hamburger-bimbi',
      name: 'Hamburger bimbi',
      category: 'protein',
      storageType: 'freezer',
      quantity: 4,
      unit: 'pz',
      perishabilityScore: 30,
      status: 'closed',
      totalServings: 4,
      whoEatsIt: JSON.stringify(['member-diego', 'member-bianca']),
      servingsAdults: 0,
      servingsChildren: 2,
    },
    {
      id: 'ing-findus',
      name: 'Bastoncini Findus',
      category: 'protein',
      storageType: 'freezer',
      quantity: 1,
      unit: 'confezione',
      perishabilityScore: 20,
      status: 'closed',
      totalServings: 6,
      whoEatsIt: JSON.stringify(['member-diego', 'member-bianca']),
      servingsAdults: 0,
      servingsChildren: 2,
    },
    {
      id: 'ing-uova',
      name: 'Uova',
      category: 'protein',
      storageType: 'fresh',
      quantity: 6,
      unit: 'pz',
      perishabilityScore: 50,
      status: 'closed',
      totalServings: 0,
      expiryDate: in10days,
    },
    {
      id: 'ing-funghi',
      name: 'Funghi champignon',
      category: 'side',
      storageType: 'fresh',
      quantity: 300,
      unit: 'g',
      perishabilityScore: 80,
      status: 'urgent',
      totalServings: 0,
      allowedMemberIds: JSON.stringify(['member-sara', 'member-davide']),
      expiryDate: in2days,
    },
    {
      id: 'ing-zucchine',
      name: 'Zucchine',
      category: 'side',
      storageType: 'fresh',
      quantity: 3,
      unit: 'pz',
      perishabilityScore: 60,
      status: 'closed',
      totalServings: 0,
      expiryDate: in5days,
    },
    {
      id: 'ing-pesto',
      name: 'Pesto Barilla',
      category: 'sauce',
      storageType: 'pantry',
      quantity: 1,
      unit: 'vasetto',
      perishabilityScore: 60,
      status: 'opened',
      totalServings: 0,
      consumeInOneSession: false,
    },
    {
      id: 'ing-pasta',
      name: 'Pasta (penne)',
      category: 'primo',
      storageType: 'pantry',
      quantity: 500,
      unit: 'g',
      perishabilityScore: 5,
      status: 'closed',
      totalServings: 0,
    },
    {
      id: 'ing-riso',
      name: 'Riso',
      category: 'primo',
      storageType: 'pantry',
      quantity: 500,
      unit: 'g',
      perishabilityScore: 5,
      status: 'closed',
      totalServings: 0,
    },
    {
      id: 'ing-mozzarella',
      name: 'Mozzarella',
      category: 'dairy',
      storageType: 'fresh',
      quantity: 2,
      unit: 'pz',
      perishabilityScore: 70,
      status: 'closed',
      totalServings: 0,
      expiryDate: in5days,
    },
    {
      id: 'ing-fiocchi',
      name: 'Fiocchi di latte',
      category: 'dairy',
      storageType: 'fresh',
      quantity: 1,
      unit: 'confezione',
      perishabilityScore: 65,
      status: 'opened',
      totalServings: 0,
      consumeInOneSession: false,
    },
  ]

  for (const ing of ingredients) {
    await prisma.ingredient.upsert({
      where: { id: ing.id },
      update: {},
      create: {
        id: ing.id,
        name: ing.name,
        category: ing.category,
        storageType: ing.storageType,
        quantity: ing.quantity,
        unit: ing.unit,
        perishabilityScore: ing.perishabilityScore,
        status: ing.status,
        totalServings: ing.totalServings ?? 0,
        whoEatsIt: ing.whoEatsIt ?? JSON.stringify([]),
        allowedMemberIds: (ing as any).allowedMemberIds ?? JSON.stringify([]),
        excludedMemberIds: JSON.stringify([]),
        servingsAdults: ing.servingsAdults ?? 2,
        servingsChildren: ing.servingsChildren ?? 2,
        consumeInOneSession: ing.consumeInOneSession ?? false,
        expiryDate: (ing as any).expiryDate ?? null,
        notes: '',
      },
    })
  }

  console.log('✓ Ingredients seeded')

  // ─── MEAL OPTIONS ────────────────────────────────────────────────────────────
  const meals = [
    { id: 'meal-pasta-pesto', name: 'Pasta al pesto', mealType: 'universal', tags: ['veloce'], preparationNotes: '10 min' },
    { id: 'meal-pollo-forno', name: 'Pollo al forno', mealType: 'adult_dinner', tags: ['proteico'] },
    { id: 'meal-hamburger-bimbi', name: 'Hamburger + patatine', mealType: 'children_dinner', tags: ['bimbi'] },
    { id: 'meal-bastoncini', name: 'Bastoncini di pesce', mealType: 'children_dinner', tags: ['bimbi', 'veloce'] },
    { id: 'meal-frittata', name: 'Frittata di verdure', mealType: 'universal', tags: ['veloce', 'vegetariano'] },
    { id: 'meal-pasta-tonno', name: 'Pasta al tonno', mealType: 'universal', tags: ['veloce'] },
    { id: 'meal-salmone-grig', name: 'Salmone alla griglia', mealType: 'adult_dinner', tags: ['light', 'proteico'] },
    { id: 'meal-riso-zucchine', name: 'Riso e zucchine', mealType: 'universal', tags: ['vegetariano', 'leggero'] },
    { id: 'meal-bresaola-rucola', name: 'Bresaola e rucola', mealType: 'adult_dinner', tags: ['light', 'veloce'] },
    { id: 'meal-pasta-funghi', name: 'Pasta ai funghi', mealType: 'adult_dinner', tags: ['vegetariano'] },
    { id: 'meal-mozzarella', name: 'Caprese', mealType: 'adult_dinner', tags: ['light', 'vegetariano'] },
    { id: 'meal-pasta-bianca', name: 'Pasta in bianco', mealType: 'children_dinner', tags: ['bimbi', 'veloce'] },
    { id: 'meal-uova-fritte', name: 'Uova al tegamino', mealType: 'universal', tags: ['veloce'] },
    { id: 'meal-pollo-bimbi', name: 'Pollo al forno per bimbi', mealType: 'children_dinner', tags: ['bimbi'] },
  ]

  for (const m of meals) {
    await prisma.mealOption.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        name: m.name,
        mealType: m.mealType,
        compatibleMemberIds: JSON.stringify([]),
        requiredIngredientIds: JSON.stringify([]),
        optionalIngredientIds: JSON.stringify([]),
        servingsAdults: 2,
        servingsChildren: 2,
        tags: JSON.stringify(m.tags ?? []),
        canBeFrozen: false,
        preparationNotes: m.preparationNotes ?? '',
      },
    })
  }

  console.log('✓ Meal options seeded')

  // ─── PLANNING RULES ──────────────────────────────────────────────────────────
  const rules = [
    { key: 'weekday_dinner_only', label: 'Feriale: solo cena', value: 'true', scope: 'dinner', description: 'Nei giorni feriali si pianifica solo la cena', active: true },
    { key: 'weekend_lunch_optional', label: 'Weekend: pranzo facoltativo', value: 'true', scope: 'lunch', description: 'Il pranzo del weekend è opzionale', active: true },
    { key: 'children_need_primo', label: 'Bimbi: primo + secondo', value: 'true', scope: 'dinner', description: 'I bambini devono avere sia primo che secondo', active: true },
    { key: 'fresh_before_frozen', label: 'Fresco prima del freezer', value: 'true', scope: 'always', description: 'Usare sempre gli ingredienti freschi prima di quelli surgelati', active: true },
    { key: 'opened_first', label: 'Aperto prima', value: 'true', scope: 'always', description: 'Priorità agli ingredienti già aperti', active: true },
    { key: 'no_protein_repeat_children', label: 'Varia le proteine bimbi', value: 'true', scope: 'dinner', description: 'Evitare la stessa proteina per i bambini due sere consecutive', active: true },
    { key: 'consume_in_session', label: 'Finire in una seduta', value: 'true', scope: 'always', description: 'Gli ingredienti segnati "da finire" vanno usati in un solo pasto', active: true },
    { key: 'max_freezer_consecutive', label: 'Max 2 sere di freezer', value: '2', scope: 'dinner', description: 'Non più di 2 cene consecutive dal freezer per i bimbi', active: true },
    { key: 'davide_vegetarian', label: 'Davide: pasto vegetariano', value: 'true', scope: 'always', description: 'Davide non mangia carne né pesce — verificare sempre', active: true },
    { key: 'bianca_no_bresaola', label: 'Bianca: no bresaola', value: 'true', scope: 'always', description: 'Bianca non mangia bresaola', active: true },
  ]

  for (const r of rules) {
    await prisma.planningRule.upsert({
      where: { key: r.key },
      update: {},
      create: r,
    })
  }

  console.log('✓ Planning rules seeded')
  console.log('\n🎉 Seed completato!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
