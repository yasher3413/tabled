import Database from "better-sqlite3"
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import path from "node:path"
import * as schema from "./schema"

export type DB = BetterSQLite3Database<typeof schema>

export const DB_PATH = path.join(process.cwd(), "data", "tabled.db")
const MIGRATIONS = path.join(process.cwd(), "drizzle")

/** Creates (or opens) a writable database and applies migrations. Used by ingestion and tests. */
export function openWritableDb(file: string): { db: DB; sqlite: Database.Database } {
  const sqlite = new Database(file)
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: MIGRATIONS })
  return { db, sqlite }
}

let readonlyDb: DB | null = null

/** Read-only handle used by the app at build and request time. */
export function getDb(): DB {
  if (!readonlyDb) {
    const sqlite = new Database(DB_PATH, { readonly: true, fileMustExist: true })
    readonlyDb = drizzle(sqlite, { schema })
  }
  return readonlyDb
}
