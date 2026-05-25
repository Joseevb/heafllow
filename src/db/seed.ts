import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { seed } from 'drizzle-seed'

import { db } from '@/db'
import {
  addresses,
  appointments,
  clientMedicines,
  clients,
  healthMetrics,
  healthScore,
  specialistAvailability,
  specialistsData,
  users,
} from '@/db/schemas'
import * as schemas from '@/db/schemas'
import { auth } from '@/lib/auth'
import { DAYS } from '@/types/date'
import { HealthMetricType } from '@/types/health-metrics'
import { SPECIALTIES } from '@/types/specialties'

const tableArgs = Bun.argv.slice(2)

if (tableArgs.length === 0) {
  console.error('Usage: bun run src/db/seed.ts <table1> <table2> ...')
  process.exit(1)
}

// Custom seeders

async function seedSpecialists() {
  console.log('  Clearing existing specialist data...')
  await db.delete(specialistAvailability)
  await db.delete(specialistsData)

  faker.seed(42)

  const now = new Date()
  const count = 10
  const primaryCareCount = 3
  const otherSpecialties = SPECIALTIES.filter((s) => s !== 'Primary Care')

  const specialties = Array.from({ length: count }, (_, i) =>
    i < primaryCareCount ? 'Primary Care' : faker.helpers.arrayElement(otherSpecialties),
  ).sort(() => Math.random() - 0.5)

  let created = 0
  for (const specialty of specialties) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const email = faker.internet.email({ firstName, lastName }).toLowerCase()

    const alreadyExists = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (alreadyExists.length > 0) continue

    const { user } = await auth.api.createUser({
      body: {
        email,
        password: 'password123',
        name: `${firstName} ${lastName}`,
        role: 'specialist',
        data: { onboardingComplete: true },
      },
    })

    const consultationDurationMinutes = faker.helpers.arrayElement([30, 45, 60])

    await db.insert(specialistsData).values({
      id: crypto.randomUUID(),
      licenseNumber: `LIC-${faker.string.alphanumeric(8).toUpperCase()}`,
      consultationDurationMinutes,
      specialistId: user.id,
      specialty,
      createdAt: now,
      updatedAt: now,
    })

    let slotCount = 0
    for (let d = 0; d < 15; d++) {
      const date = new Date(now)
      date.setDate(date.getDate() + d)
      const dayName = DAYS[date.getDay()]

      const addBlock = async (baseHour: number, range: number) => {
        const start = new Date(date)
        start.setHours(
          baseHour + faker.number.int({ min: 0, max: range - 1 }),
          faker.number.int({ min: 0, max: 59 }),
          0,
          0,
        )
        const end = new Date(start)
        end.setHours(start.getHours() + faker.number.int({ min: 2, max: 4 }))
        try {
          await db.insert(specialistAvailability).values({
            id: crypto.randomUUID(),
            dayOfWeek: dayName,
            startTime: start,
            endTime: end,
            isAvailable: true,
            specialistId: user.id,
            createdAt: now,
            updatedAt: now,
          })
          slotCount++
        } catch {
          // skip duplicate (dayOfWeek + startTime + endTime collision)
        }
      }

      await addBlock(8, 2)
      await addBlock(13, 2)
    }
    created++
    console.log(
      `  [${created}/${count}] ${specialty}: ${firstName} ${lastName} (${consultationDurationMinutes}min)`,
    )
  }

  console.log(`  Created ${created} specialist(s)`)
}

function randomPastDate(daysBack: number) {
  return faker.date.recent({ days: daysBack })
}

function randomFutureDate(daysAhead: number) {
  return faker.date.soon({ days: daysAhead })
}

function splitUserName(name: string) {
  const parts = name.trim().split(/\s+/)
  const firstName = parts[0] ?? 'Client'
  const lastName = parts.slice(1).join(' ') || faker.person.lastName()

  return { firstName, lastName }
}

function buildMetricValue(metricType: keyof typeof HealthMetricType) {
  switch (metricType) {
    case 'BLOOD_PRESSURE_SYSTOLIC':
      return faker.number.int({ min: 108, max: 132 })
    case 'BLOOD_PRESSURE_DIASTOLIC':
      return faker.number.int({ min: 68, max: 86 })
    case 'HEART_RATE':
      return faker.number.int({ min: 58, max: 92 })
    case 'OXYGEN_SATURATION':
      return faker.number.int({ min: 95, max: 100 })
    case 'WEIGHT':
      return faker.number.float({ min: 58, max: 98, fractionDigits: 1 })
    case 'HEIGHT':
      return faker.number.int({ min: 155, max: 192 })
    case 'BMI':
      return faker.number.float({ min: 20, max: 31, fractionDigits: 1 })
    case 'BLOOD_GLUCOSE':
      return faker.number.int({ min: 78, max: 118 })
    case 'HBA1C':
      return faker.number.float({ min: 4.8, max: 6.4, fractionDigits: 1 })
    case 'CHOLESTEROL_TOTAL':
      return faker.number.int({ min: 150, max: 220 })
    case 'CHOLESTEROL_LDL':
      return faker.number.int({ min: 70, max: 140 })
    case 'CHOLESTEROL_HDL':
      return faker.number.int({ min: 45, max: 78 })
    case 'TRIGLYCERIDES':
      return faker.number.int({ min: 90, max: 180 })
    case 'BODY_TEMPERATURE':
      return faker.number.float({ min: 36.3, max: 37.2, fractionDigits: 1 })
    case 'RESPIRATORY_RATE':
      return faker.number.int({ min: 12, max: 19 })
    case 'SLEEP_HOURS':
      return faker.number.float({ min: 6, max: 9, fractionDigits: 1 })
    case 'EXERCISE_MINUTES':
      return faker.number.int({ min: 20, max: 75 })
    case 'WATER_INTAKE':
      return faker.number.float({ min: 1.8, max: 3.5, fractionDigits: 1 })
    case 'STEPS':
      return faker.number.int({ min: 4500, max: 14000 })
  }
}

async function seedMedicalInfo() {
  const availableClients = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, 'client'))

  if (availableClients.length === 0) {
    console.error('No users with role client were found')
    process.exit(1)
  }

  console.log('Available client users:')
  for (const client of availableClients) {
    console.log(`  ${client.name} (${client.id})`)
  }

  let selectedClient: (typeof availableClients)[number] | undefined
  while (!selectedClient) {
    const selectedClientId = prompt('Enter the client id to seed medical info for:')?.trim()

    if (!selectedClientId) {
      console.error('A client id is required')
      process.exit(1)
    }

    selectedClient = availableClients.find((client) => client.id === selectedClientId)

    if (!selectedClient) {
      console.error(`Unknown client id: ${selectedClientId}`)
    }
  }

  const specialistUsers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, 'specialist'))

  if (specialistUsers.length === 0) {
    console.error('No specialist users were found. Seed specialists first.')
    process.exit(1)
  }

  const primaryCareSpecialists = await db
    .select({ specialistId: specialistsData.specialistId })
    .from(specialistsData)
    .where(eq(specialistsData.specialty, 'Primary Care'))

  const specialistIdPool = specialistUsers.map((specialist) => specialist.id)
  const primaryCareSpecialistId = primaryCareSpecialists[0]?.specialistId ?? specialistIdPool[0]

  const seedBase = selectedClient.id
    .split('')
    .reduce((total, character) => total + character.charCodeAt(0), 0)
  faker.seed(seedBase)

  const { firstName, lastName } = splitUserName(selectedClient.name)
  const appointmentDates = [
    faker.date.past({ years: 1 }),
    faker.date.recent({ days: 45 }),
    randomFutureDate(10),
    randomFutureDate(30),
  ].sort((left, right) => left.getTime() - right.getTime())
  const appointmentStatuses = ['completed', 'completed', 'confirmed', 'pending'] as const
  const appointmentDurations = [30, 45, 30, 60]
  const medicineCatalog = [
    { name: 'Metformin', medicineId: 101, dosage: '500 mg', frequency: 'Twice daily' },
    { name: 'Lisinopril', medicineId: 205, dosage: '10 mg', frequency: 'Once daily' },
    { name: 'Atorvastatin', medicineId: 318, dosage: '20 mg', frequency: 'At bedtime' },
  ]
  const metricTypes = [
    'BLOOD_PRESSURE_SYSTOLIC',
    'BLOOD_PRESSURE_DIASTOLIC',
    'HEART_RATE',
    'WEIGHT',
    'BMI',
    'BLOOD_GLUCOSE',
    'BODY_TEMPERATURE',
    'SLEEP_HOURS',
    'WATER_INTAKE',
    'STEPS',
  ] as const

  await db.transaction(async (tx) => {
    await tx.delete(appointments).where(eq(appointments.clientId, selectedClient.id))
    await tx.delete(healthMetrics).where(eq(healthMetrics.clientId, selectedClient.id))
    await tx.delete(clientMedicines).where(eq(clientMedicines.userId, selectedClient.id))
    await tx.delete(healthScore).where(eq(healthScore.userId, selectedClient.id))
    await tx.delete(addresses).where(eq(addresses.userId, selectedClient.id))
    await tx.delete(clients).where(eq(clients.clientId, selectedClient.id))

    const birthDate = faker.date.birthdate({ min: 24, max: 72, mode: 'age' })
    const now = new Date()

    await tx.insert(clients).values({
      firstName,
      lastName,
      birthDate,
      phoneNumber: faker.phone.number({ style: 'international' }),
      clientId: selectedClient.id,
      primaryCareSpecialist: primaryCareSpecialistId,
      createdAt: now,
      updatedAt: now,
    })

    await tx.insert(addresses).values({
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      zipCode: faker.location.zipCode(),
      userId: selectedClient.id,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })

    await tx.insert(appointments).values(
      appointmentDates.map((appointmentDate, index) => ({
        status: appointmentStatuses[index],
        durationMinutes: appointmentDurations[index],
        appointmentDate,
        notes: faker.helpers.arrayElement([
          'Routine follow-up visit',
          'Medication review and symptom check',
          'Preventive care consultation',
        ]),
        cancellationReason: null,
        clientId: selectedClient.id,
        specialistId:
          index === 0 ? primaryCareSpecialistId : faker.helpers.arrayElement(specialistIdPool),
        createdAt: randomPastDate(120),
        updatedAt: now,
      })),
    )

    await tx.insert(healthMetrics).values(
      metricTypes.map((metricType) => {
        const metric = HealthMetricType[metricType]

        return {
          metricType,
          value: buildMetricValue(metricType),
          unit: metric.defaultUnit,
          notes: `${metric.displayName} entered during seeded medical intake`,
          source: 'manual',
          clientId: selectedClient.id,
          recordedBySpecialistId: faker.helpers.arrayElement(specialistIdPool),
          createdAt: randomPastDate(90),
          updatedAt: now,
        }
      }),
    )

    await tx.insert(clientMedicines).values(
      medicineCatalog.map((medicine, index) => ({
        ...medicine,
        userId: selectedClient.id,
        startDate: faker.date.past({ years: 1 }),
        endDate: faker.date.soon({ days: 90 + index * 15 }),
        createdAt: randomPastDate(120),
        updatedAt: now,
      })),
    )

    await tx.insert(healthScore).values({
      overallScore: faker.number.int({ min: 72, max: 95 }),
      cardiovascularScore: faker.number.int({ min: 70, max: 96 }),
      metabolicScore: faker.number.int({ min: 68, max: 94 }),
      lifestyleScore: faker.number.int({ min: 65, max: 93 }),
      vitalScore: faker.number.int({ min: 74, max: 97 }),
      dataPointsCount: metricTypes.length,
      periodDays: 90,
      userId: selectedClient.id,
      createdAt: now,
      updatedAt: now,
    })
  })

  console.log(`  Seeded medical info for ${selectedClient.name} (${selectedClient.id})`)
}

async function seedAdmin() {
  const existingUser = await db.select().from(users).where(eq(users.email, 'admin@admin.admin'))

  if (existingUser.length > 0) {
    console.log({ ...existingUser[0] })
    return
  }

  const { user } = await auth.api.createUser({
    body: {
      email: 'admin@admin.admin',
      password: 'admin',
      name: 'admin',
      role: 'admin',
      data: { onboardingComplete: true },
    },
  })

  console.log({ ...user })
}

async function seedBasicSpecialist() {
  const existingUser = await db.select().from(users).where(eq(users.email, 'spe@test.com'))

  if (existingUser.length > 0) {
    console.log({ ...existingUser[0] })
    return
  }

  const { user } = await auth.api.createUser({
    body: {
      email: 'spe@test.com',
      password: 'spe',
      name: 'Test Specialist',
      role: 'specialist',
      data: { onboardingComplete: true },
    },
  })

  const res = await db.insert(specialistsData).values({
    consultationDurationMinutes: 30,
    licenseNumber: 'TEST123456',
    specialistId: user.id,
    specialty: 'Primary Care',
  })

  console.log({ ...user, specialistData: res })
}

const customSeeders: Record<string, () => Promise<void>> = {
  'medical-info': seedMedicalInfo,
  specialists: seedSpecialists,
  admin: seedAdmin,
  'basic-specialist': seedBasicSpecialist,
}

// ── Run ─────────────────────────────────────────────────────

const customKeys = tableArgs.filter((t) => t in customSeeders)
const schemaKeys = tableArgs.filter((t) => t in schemas && !(t in customSeeders))
const unknown = tableArgs.filter((t) => !(t in schemas) && !(t in customSeeders))

if (unknown.length > 0) {
  console.error('Unknown:', unknown.join(', '))
  process.exit(1)
}

for (const key of customKeys) {
  console.log(`Custom seeding: ${key}`)
  await customSeeders[key]()
}

if (schemaKeys.length > 0) {
  const toSeed: Record<string, unknown> = {}
  for (const name of schemaKeys) {
    toSeed[name] = (schemas as Record<string, unknown>)[name]
  }
  console.log(`Default seeding: ${schemaKeys.join(', ')}`)
  await seed(db, toSeed)
}

console.log('Done.')
