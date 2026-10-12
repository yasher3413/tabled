import { describe, expect, it } from "vitest"
import { openWritableDb } from "./client"
import { sessions } from "./schema"

describe("schema migrations", () => {
  it("apply cleanly to an empty database", () => {
    const { db, sqlite } = openWritableDb(":memory:")
    db.insert(sessions).values({ id: "45-1", parliament: 45, session: 1, isCurrent: true }).run()
    expect(db.select().from(sessions).all()).toHaveLength(1)
    sqlite.close()
  })
})
