import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'

import { Database } from 'bun:sqlite'
import { beforeEach, describe, expect, test } from 'bun:test'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

import {
  BaseRepository,
  DatabaseError,
  EntityNotFoundError,
} from '../../../src/db/repository/base-repository'

// Test schema
const testTable = sqliteTable('test_entities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  value: integer('value'),
})

type NewTestEntity = typeof testTable.$inferInsert

describe('BaseRepository', () => {
  let sqlite: Database
  let db: ReturnType<typeof drizzle>
  let repo: BaseRepository<typeof testTable, Record<string, object>, string>
  const nameColumn = (cols: typeof repo.columns) => sql<string>`${cols.name}`

  beforeEach(() => {
    sqlite = new Database(':memory:')
    db = drizzle({ client: sqlite })

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS test_entities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        value INTEGER
      )
    `)

    repo = new BaseRepository(db as unknown as BunSQLiteDatabase<Record<string, object>>, testTable)
  })

  describe('save', () => {
    test('should save and return entity', async () => {
      const entity: NewTestEntity = { id: '1', name: 'Test', value: 100 }
      const result = await repo.save(entity)

      expect(result.status).toBe('ok')
      if (result.status === 'ok') {
        expect(result.value.id).toBe('1')
        expect(result.value.name).toBe('Test')
        expect(result.value.value).toBe(100)
      }
    })
  })

  describe('findById', () => {
    test('should find entity by id', async () => {
      await repo.save({ id: '1', name: 'Test', value: 100 })

      const result = await repo.findById('1')
      expect(result.status).toBe('ok')
      if (result.status === 'ok') {
        expect(result.value.id).toBe('1')
        expect(result.value.name).toBe('Test')
      }
    })

    test('should return error when entity not found', async () => {
      const result = await repo.findById('non-existent')
      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error).toBeInstanceOf(EntityNotFoundError)
        expect(result.error.value).toBe('non-existent')
      }
    })
  })

  describe('findBy', () => {
    test('should find entity by column', async () => {
      await repo.save({ id: '1', name: 'Test', value: 100 })

      const result = await repo.findBy(nameColumn, 'Test')
      expect(result.status).toBe('ok')
      if (result.status === 'ok') {
        expect(result.value.id).toBe('1')
      }
    })

    test('should return error when not found by column', async () => {
      const result = await repo.findBy(nameColumn, 'NonExistent')
      expect(result.status).toBe('error')
    })
  })

  describe('save errors', () => {
    test('should return a database error when insert fails', async () => {
      await repo.save({ id: '1', name: 'Test', value: 100 })

      const result = await repo.save({ id: '1', name: 'Duplicate', value: 200 })

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error).toBeInstanceOf(DatabaseError)
        expect(result.error.message).toBe('Failed to save entity')
      }
    })
  })

  describe('findMany', () => {
    test('should find multiple entities by column', async () => {
      await repo.save({ id: '1', name: 'Test1', value: 100 })
      await repo.save({ id: '2', name: 'Test2', value: 200 })
      await repo.save({ id: '3', name: 'Test1', value: 300 })

      const results = await repo.findMany(nameColumn, 'Test1')
      expect(results.length).toBe(2)
    })

    test('should return empty array when no matches', async () => {
      const results = await repo.findMany(nameColumn, 'NonExistent')
      expect(results.length).toBe(0)
    })
  })

  describe('findAll', () => {
    test('should return all entities', async () => {
      await repo.save({ id: '1', name: 'Test1', value: 100 })
      await repo.save({ id: '2', name: 'Test2', value: 200 })

      const results = await repo.findAll()
      expect(results.length).toBe(2)
    })
  })

  describe('update', () => {
    test('should update entity', async () => {
      await repo.save({ id: '1', name: 'Test', value: 100 })

      const result = await repo.update('1', { name: 'Updated', value: 200 })
      expect(result.status).toBe('ok')
      if (result.status === 'ok') {
        expect(result.value.name).toBe('Updated')
      }
    })

    test('should return error when updating non-existent entity', async () => {
      const result = await repo.update('non-existent', { name: 'Updated' })
      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error).toBeInstanceOf(EntityNotFoundError)
      }
    })

    test('should return database error when update throws', async () => {
      await repo.save({ id: '1', name: 'Test', value: 100 })
      sqlite.close()

      const result = await repo.update('1', { name: 'Updated' })

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error).toBeInstanceOf(DatabaseError)
        if (result.error instanceof DatabaseError) {
          expect(result.error.message).toBe('Failed to update entity')
        }
      }
    })
  })

  describe('delete', () => {
    test('should delete entity', async () => {
      await repo.save({ id: '1', name: 'Test', value: 100 })

      const result = await repo.delete('1')
      expect(result.status).toBe('ok')

      const findResult = await repo.findById('1')
      expect(findResult.status).toBe('error')
    })

    test('should return error when deleting non-existent entity', async () => {
      const result = await repo.delete('missing')

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error).toBeInstanceOf(EntityNotFoundError)
        if (result.error instanceof EntityNotFoundError) {
          expect(result.error.field).toBe('id')
          expect(result.error.value).toBe('missing')
        }
      }
    })

    test('should return database error when delete throws', async () => {
      await repo.save({ id: '1', name: 'Test', value: 100 })
      sqlite.close()

      const result = await repo.delete('1')

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error).toBeInstanceOf(DatabaseError)
        if (result.error instanceof DatabaseError) {
          expect(result.error.message).toBe('Failed to delete entity')
        }
      }
    })
  })

  describe('exists', () => {
    test('should return true when entity exists', async () => {
      await repo.save({ id: '1', name: 'Test', value: 100 })

      const exists = await repo.exists('1')
      expect(exists).toBe(true)
    })

    test('should return false when entity does not exist', async () => {
      const exists = await repo.exists('non-existent')
      expect(exists).toBe(false)
    })
  })
})
