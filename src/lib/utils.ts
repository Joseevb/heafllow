import type { ClassValue } from 'clsx'

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { RoutePath } from '@/types/routes'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

export function keysOf<T extends Record<string, unknown>>(value: T): Array<keyof T> {
  return Object.keys(value) as Array<keyof T>
}

type TypedUrl = `${string}${RoutePath}`

export function createUrl(path: RoutePath, params?: Record<string, string>): TypedUrl {
  const url = new URL(path!, window.location.origin)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  return url.toString() as TypedUrl
}

export function getInitials(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return 'U'

  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

export function formatMetricTitle(metricType: string): string {
  const titleMap: Record<string, string> = {
    BLOOD_PRESSURE_SYSTOLIC: 'Blood Pressure (Systolic)',
    BLOOD_PRESSURE_DIASTOLIC: 'Blood Pressure (Diastolic)',
    HEART_RATE: 'Heart Rate',
    OXYGEN_SATURATION: 'Oxygen Saturation',
    WEIGHT: 'Weight',
    HEIGHT: 'Height',
    BMI: 'BMI',
    BLOOD_GLUCOSE: 'Blood Glucose',
    HBA1C: 'HbA1c',
    CHOLESTEROL_TOTAL: 'Total Cholesterol',
    CHOLESTEROL_LDL: 'LDL Cholesterol',
    CHOLESTEROL_HDL: 'HDL Cholesterol',
    TRIGLYCERIDES: 'Triglycerides',
    BODY_TEMPERATURE: 'Body Temperature',
    RESPIRATORY_RATE: 'Respiratory Rate',
    SLEEP_HOURS: 'Sleep Duration',
    EXERCISE_MINUTES: 'Exercise',
    WATER_INTAKE: 'Water Intake',
    STEPS: 'Steps',
  }
  return titleMap[metricType] || metricType.replace(/_/g, ' ')
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(date: string) {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}
