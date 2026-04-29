import type { SQL } from 'drizzle-orm'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'

import { Result, TaggedError } from 'better-result'
import { eq, getTableColumns } from 'drizzle-orm'

export class DatabaseError extends TaggedError('DatabaseError')<{
  message: string
  cause?: string
}>() {}

export class EntityNotFoundError extends TaggedError('EntityNotFoundError')<{
  field: string
  value: string | number | boolean | null
}>() {}

// Helper type to extract column type from table
type TableColumns<TTable extends SQLiteTable> = ReturnType<typeof getTableColumns<TTable>>

interface BaseRepositoryContract<TTable extends SQLiteTable, TIdentifier> {
  findAll: () => Promise<Array<TTable['$inferSelect']>>
  findBy: <TValue extends string | number | boolean | null>(
    column: (t: TableColumns<TTable>) => SQL<TValue>,
    value: TValue,
  ) => Promise<Result<TTable['$inferSelect'], EntityNotFoundError>>
  findById: (id: TIdentifier) => Promise<Result<TTable['$inferSelect'], EntityNotFoundError>>
  findMany: <TValue>(
    column: (t: TableColumns<TTable>) => SQL<TValue>,
    value: TValue,
  ) => Promise<Array<TTable['$inferSelect']>>

  save: (entity: TTable['$inferInsert']) => Promise<Result<TTable['$inferSelect'], DatabaseError>>
  update: (
    id: TIdentifier,
    partial: Partial<TTable['$inferInsert']>,
  ) => Promise<Result<TTable['$inferSelect'], EntityNotFoundError | DatabaseError>>
  delete: (id: TIdentifier) => Promise<Result<void, EntityNotFoundError | DatabaseError>>

  exists: (id: TIdentifier) => Promise<boolean>
}

export class BaseRepository<
  TTable extends SQLiteTable,
  TSchema extends Record<string, object> = Record<string, object>,
  TIdentifier extends string | number | boolean | null = string,
> implements BaseRepositoryContract<TTable, TIdentifier> {
  #db: BunSQLiteDatabase<TSchema>
  #table: TTable
  #columns: TableColumns<TTable>

  constructor(db: BunSQLiteDatabase<TSchema>, table: TTable) {
    this.#db = db
    this.#table = table
    this.#columns = getTableColumns(table)
  }

  get db() {
    return this.#db
  }
  get table() {
    return this.#table
  }
  get columns() {
    return this.#columns
  }

  async findAll(): Promise<Array<TTable['$inferSelect']>> {
    return this.#db.select().from(this.#table)
  }

  async findBy<TValue extends string | number | boolean | null>(
    column: (cols: TableColumns<TTable>) => SQL<TValue>,
    value: TValue,
  ): Promise<Result<TTable['$inferSelect'], EntityNotFoundError>> {
    const rows = await this.#db
      .select()
      .from(this.#table)
      .where(eq(column(this.#columns), value))
      .limit(1)

    if (rows.length === 0) {
      return Result.err(
        new EntityNotFoundError({
          field: column(this.#columns).toString(),
          value,
        }),
      )
    }
    return Result.ok(rows[0])
  }

  async findById(
    id: TIdentifier,
    idColumn: (cols: TableColumns<TTable>) => SQL<TIdentifier> = (cols) =>
      cols.id as unknown as SQL<TIdentifier>,
  ): Promise<Result<TTable['$inferSelect'], EntityNotFoundError>> {
    return this.findBy(idColumn, id)
  }

  async findMany<TValue>(
    column: (cols: TableColumns<TTable>) => SQL<TValue>,
    value: TValue,
  ): Promise<Array<TTable['$inferSelect']>> {
    return this.#db
      .select()
      .from(this.#table)
      .where(eq(column(this.#columns), value))
  }

  async save(
    entity: TTable['$inferInsert'],
  ): Promise<Result<TTable['$inferSelect'], DatabaseError>> {
    return Result.tryPromise({
      try: async () => {
        const rows = await this.#db.insert(this.#table).values(entity).returning()

        return rows[0]
      },
      catch: (cause) =>
        new DatabaseError({
          message: 'Failed to save entity',
          cause: String(cause),
        }),
    })
  }

  async update(
    id: TIdentifier,
    partial: Partial<TTable['$inferInsert']>,
  ): Promise<Result<TTable['$inferSelect'], EntityNotFoundError | DatabaseError>> {
    const self = this

    return Result.gen(async function* () {
      const rows = yield* await Result.tryPromise<Array<TTable['$inferSelect']>, DatabaseError>({
        try: async () => {
          return await self.#db
            .update(self.#table)
            .set(partial)
            .where(eq(self.#columns.id as unknown as SQL<TIdentifier>, id))
            .returning()
        },
        catch: (cause) =>
          new DatabaseError({
            message: 'Failed to update entity',
            cause: String(cause),
          }),
      })

      if (rows.length === 0) {
        return yield* Result.err(
          new EntityNotFoundError({
            field: 'id',
            value: id,
          }),
        )
      }

      return Result.ok(rows[0])
    })
  }

  async delete(id: TIdentifier) {
    const self = this

    return Result.gen(async function* () {
      const rows = yield* await Result.tryPromise<
        Array<Pick<TTable['$inferSelect'], 'id'>>,
        DatabaseError
      >({
        try: async () =>
          await self.#db
            .delete(self.#table)
            .where(eq(self.#columns.id as unknown as SQL<TIdentifier>, id))
            .returning({ id: self.#columns.id }),
        catch: (cause) =>
          new DatabaseError({
            message: 'Failed to delete entity',
            cause: String(cause),
          }),
      })

      if (rows.length === 0) {
        return yield* Result.err(
          new EntityNotFoundError({
            field: 'id',
            value: id,
          }),
        )
      }

      return Result.ok()
    })
  }

  async exists(id: TIdentifier): Promise<boolean> {
    const result = await this.#db
      .select({ id: this.#columns.id })
      .from(this.#table)
      .where(eq(this.#columns.id as unknown as SQL<TIdentifier>, id))
      .limit(1)

    return result.length > 0
  }
}
