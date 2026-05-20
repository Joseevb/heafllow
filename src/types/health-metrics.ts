import { keysOf } from '@/lib/utils'

export const HealthMetricType = {
  BLOOD_PRESSURE_SYSTOLIC: {
    displayName: 'Blood Pressure (Systolic)',
    defaultUnit: 'mmHg',
    category: 'cardiovascular',
  },
  BLOOD_PRESSURE_DIASTOLIC: {
    displayName: 'Blood Pressure (Diastolic)',
    defaultUnit: 'mmHg',
    category: 'cardiovascular',
  },
  HEART_RATE: {
    displayName: 'Heart Rate',
    defaultUnit: 'bpm',
    category: 'cardiovascular',
  },
  OXYGEN_SATURATION: {
    displayName: 'Oxygen Saturation',
    defaultUnit: '%',
    category: 'cardiovascular',
  },

  WEIGHT: {
    displayName: 'Weight',
    defaultUnit: 'kg',
    category: 'metabolic',
  },
  HEIGHT: {
    displayName: 'Height',
    defaultUnit: 'cm',
    category: 'metabolic',
  },
  BMI: {
    displayName: 'Body Mass Index',
    defaultUnit: 'kg/m²',
    category: 'metabolic',
  },
  BLOOD_GLUCOSE: {
    displayName: 'Blood Glucose',
    defaultUnit: 'mg/dL',
    category: 'metabolic',
  },
  HBA1C: {
    displayName: 'HbA1c',
    defaultUnit: '%',
    category: 'metabolic',
  },
  CHOLESTEROL_TOTAL: {
    displayName: 'Total Cholesterol',
    defaultUnit: 'mg/dL',
    category: 'metabolic',
  },
  CHOLESTEROL_LDL: {
    displayName: 'LDL Cholesterol',
    defaultUnit: 'mg/dL',
    category: 'metabolic',
  },
  CHOLESTEROL_HDL: {
    displayName: 'HDL Cholesterol',
    defaultUnit: 'mg/dL',
    category: 'metabolic',
  },
  TRIGLYCERIDES: {
    displayName: 'Triglycerides',
    defaultUnit: 'mg/dL',
    category: 'metabolic',
  },

  BODY_TEMPERATURE: {
    displayName: 'Body Temperature',
    defaultUnit: '°C',
    category: 'vital',
  },
  RESPIRATORY_RATE: {
    displayName: 'Respiratory Rate',
    defaultUnit: 'breaths/min',
    category: 'vital',
  },

  SLEEP_HOURS: {
    displayName: 'Sleep Duration',
    defaultUnit: 'hours',
    category: 'lifestyle',
  },
  EXERCISE_MINUTES: {
    displayName: 'Exercise Duration',
    defaultUnit: 'minutes',
    category: 'lifestyle',
  },
  WATER_INTAKE: {
    displayName: 'Water Intake',
    defaultUnit: 'liters',
    category: 'lifestyle',
  },
  STEPS: {
    displayName: 'Steps',
    defaultUnit: 'steps',
    category: 'lifestyle',
  },
} as const

export const HealthMetricTypeKeys = keysOf(HealthMetricType) as [
  keyof typeof HealthMetricType,
  ...Array<keyof typeof HealthMetricType>,
]

export type HealthMetricType = keyof typeof HealthMetricType

export type HealthMetricTypeValue = (typeof HealthMetricType)[HealthMetricType]
