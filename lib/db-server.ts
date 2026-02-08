// t.me/SentinelLinks

// Server-side SQLite Database Management (without license keys)
import Database from "better-sqlite3"
import { join } from "path"
import { existsSync, unlinkSync, renameSync } from "fs"
import { v4 as uuidv4 } from "uuid"

export interface User {
  id: string
  username: string
  password: string
  is_admin: boolean
  created_at: string
  uid: string
  blocked: boolean
}

let db: Database.Database | null = null
let dbInitialized = false

const ALLOWED_USER_FIELDS = ["username", "password", "is_admin", "blocked"] as const

function safeDeleteFile(path: string): boolean {
  try {
    if (existsSync(path)) {
      unlinkSync(path)
    }
    return true
  } catch (e: any) {
    if (e.code === "EBUSY" || e.code === "EPERM" || e.code === "EACCES") {
      try {
        const backupPath = path + ".corrupted." + Date.now()
        renameSync(path, backupPath)
        return true
      } catch (renameErr: any) {
        return false
      }
    }
    return false
  }
}

function getDB(): Database.Database {
  if (db && dbInitialized) {
    try {
      db.prepare("SELECT 1").get()
      return db
    } catch {
      db = null
      dbInitialized = false
    }
  }

  const dbPath = join(process.cwd(), "database.db")
  const altDbPath = join(process.cwd(), "database_new.db")

  try {
    db = new Database(dbPath)
    db.pragma("journal_mode = WAL")

    try {
      db.prepare("SELECT 1").get()
    } catch (testError: any) {
      try {
        db.close()
      } catch {}
      db = null

      const deleted = safeDeleteFile(dbPath) && safeDeleteFile(dbPath + "-wal") && safeDeleteFile(dbPath + "-shm")

      if (!deleted) {
        safeDeleteFile(altDbPath)
        safeDeleteFile(altDbPath + "-wal")
        safeDeleteFile(altDbPath + "-shm")

        db = new Database(altDbPath)
        db.pragma("journal_mode = WAL")
        initializeTables()
        dbInitialized = true
        return db
      }

      db = new Database(dbPath)
      db.pragma("journal_mode = WAL")
    }

    initializeTables()
    dbInitialized = true
    return db
  } catch (error: any) {
    try {
      safeDeleteFile(altDbPath)
      safeDeleteFile(altDbPath + "-wal")
      safeDeleteFile(altDbPath + "-shm")

      db = new Database(altDbPath)
      db.pragma("journal_mode = WAL")
      initializeTables()
      dbInitialized = true
      return db
    } catch (altError: any) {
      throw new Error("Database initialization failed. Please manually delete database.db and restart.")
    }
  }
}

function initializeTables() {
  if (!db) return

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      uid TEXT UNIQUE NOT NULL,
      blocked INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS device_owners (
      device_id TEXT PRIMARY KEY,
      user_uid TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'news',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT NOT NULL
    );
  `)

  try {
    const usersWithoutUID = db.prepare("SELECT id, username FROM users WHERE uid IS NULL OR uid = ''").all() as {
      id: string
      username: string
    }[]

    if (usersWithoutUID.length > 0) {
      for (const user of usersWithoutUID) {
        const newUid = uuidv4()
        db.prepare("UPDATE users SET uid = ? WHERE id = ?").run(newUid, user.id)
      }
    }
  } catch (e) {}

  try {
    const adminCheck = db
      .prepare("SELECT COUNT(*) as count FROM users WHERE username = ? COLLATE NOCASE")
      .get("Bogratkm") as { count: number }

    if (adminCheck.count === 0) {
      const userId = uuidv4()
      const userUid = uuidv4()
      db.prepare(`
        INSERT INTO users (id, username, password, is_admin, uid, blocked)
        VALUES (?, ?, ?, 1, ?, 0)
      `).run(userId, "Bogratkm", "Cooldoxer67", userUid)
    }
  } catch (e) {}
}

export function getUsers(): User[] {
  try {
    const database = getDB()
    return database.prepare("SELECT * FROM users").all() as User[]
  } catch (error) {
    console.error("[DB] getUsers error:", error)
    return []
  }
}

export function getUserByUsername(username: string): User | null {
  try {
    const database = getDB()
    const user = database.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE").get(username) as
      | User
      | undefined
    return user || null
  } catch (error) {
    console.error("[DB] getUserByUsername error:", error)
    return null
  }
}

export function getUserById(id: string): User | null {
  try {
    const database = getDB()
    const user = database.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined
    return user || null
  } catch (error) {
    console.error("[DB] getUserById error:", error)
    return null
  }
}

export function getUserByUid(uid: string): User | null {
  try {
    const database = getDB()
    const user = database.prepare("SELECT * FROM users WHERE uid = ?").get(uid) as User | undefined
    return user || null
  } catch (error) {
    console.error("[DB] getUserByUid error:", error)
    return null
  }
}

export function createUser(username: string, password: string): User | null {
  try {
    if (!username || !password) return null
    if (typeof username !== "string" || typeof password !== "string") return null

    const sanitizedUsername = username.trim().slice(0, 50)
    if (!/^[a-zA-Z0-9_]+$/.test(sanitizedUsername)) return null

    const existing = getUserByUsername(sanitizedUsername)
    if (existing) return null

    const database = getDB()
    const newUser = {
      id: uuidv4(),
      username: sanitizedUsername,
      password,
      is_admin: 0,
      uid: uuidv4(),
      blocked: 0,
    }

    database
      .prepare(`
      INSERT INTO users (id, username, password, is_admin, uid, blocked)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      .run(newUser.id, newUser.username, newUser.password, newUser.is_admin, newUser.uid, newUser.blocked)

    return getUserById(newUser.id)
  } catch (error) {
    console.error("[DB] createUser error:", error)
    return null
  }
}

export function updateUser(userId: string, updates: Partial<User>): boolean {
  try {
    if (!userId || typeof userId !== "string") return false

    const database = getDB()

    const safeUpdates: { field: string; value: any }[] = []

    for (const [key, value] of Object.entries(updates)) {
      if (ALLOWED_USER_FIELDS.includes(key as any)) {
        safeUpdates.push({ field: key, value })
      }
    }

    if (safeUpdates.length === 0) return false

    for (const { field, value } of safeUpdates) {
      switch (field) {
        case "username":
          database.prepare("UPDATE users SET username = ? WHERE id = ?").run(value, userId)
          break
        case "password":
          database.prepare("UPDATE users SET password = ? WHERE id = ?").run(value, userId)
          break
        case "is_admin":
          database.prepare("UPDATE users SET is_admin = ? WHERE id = ?").run(value ? 1 : 0, userId)
          break
        case "blocked":
          database.prepare("UPDATE users SET blocked = ? WHERE id = ?").run(value ? 1 : 0, userId)
          break
      }
    }

    return true
  } catch (error) {
    console.error("[DB] updateUser error:", error)
    return false
  }
}

export function deleteUser(userId: string): boolean {
  try {
    if (!userId || typeof userId !== "string") return false

    const database = getDB()
    database.prepare("DELETE FROM users WHERE id = ? AND username != 'Bogratkm'").run(userId)
    return true
  } catch (error) {
    console.error("[DB] deleteUser error:", error)
    return false
  }
}

export function setDeviceOwner(deviceId: string, userUid: string): void {
  try {
    if (!deviceId || !userUid) return

    const database = getDB()
    database.prepare("INSERT OR REPLACE INTO device_owners (device_id, user_uid) VALUES (?, ?)").run(deviceId, userUid)
  } catch (error) {
    console.error("[DB] setDeviceOwner error:", error)
  }
}

export function getDevicesByUID(uid: string): string[] {
  try {
    if (!uid) return []

    const database = getDB()
    const devices = database.prepare("SELECT device_id FROM device_owners WHERE user_uid = ?").all(uid) as {
      device_id: string
    }[]
    return devices.map((d) => d.device_id)
  } catch (error) {
    console.error("[DB] getDevicesByUID error:", error)
    return []
  }
}

export function getNews(type: "news" | "changelog" = "news"): any[] {
  try {
    const database = getDB()
    return database.prepare("SELECT * FROM news WHERE type = ? ORDER BY created_at DESC").all(type) as any[]
  } catch (error) {
    console.error("[DB] getNews error:", error)
    return []
  }
}

export function createNews(title: string, content: string, type: "news" | "changelog", createdBy: string): any {
  try {
    if (!title || !content || !createdBy) return null
    const sanitizedTitle = String(title).slice(0, 200)
    const sanitizedContent = String(content).slice(0, 10000)
    const sanitizedType = type === "changelog" ? "changelog" : "news"

    const database = getDB()
    const id = uuidv4()
    database
      .prepare("INSERT INTO news (id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)")
      .run(id, sanitizedTitle, sanitizedContent, sanitizedType, createdBy)
    return database.prepare("SELECT * FROM news WHERE id = ?").get(id)
  } catch (error) {
    console.error("[DB] createNews error:", error)
    return null
  }
}

export function deleteNews(id: string): boolean {
  try {
    if (!id || typeof id !== "string") return false

    const database = getDB()
    database.prepare("DELETE FROM news WHERE id = ?").run(id)
    return true
  } catch (error) {
    console.error("[DB] deleteNews error:", error)
    return false
  }
}

export function resetDatabase(): boolean {
  try {
    if (db) {
      db.close()
      db = null
      dbInitialized = false
    }

    const dbPath = join(process.cwd(), "database.db")
    safeDeleteFile(dbPath)
    safeDeleteFile(dbPath + "-wal")
    safeDeleteFile(dbPath + "-shm")

    getDB()
    return true
  } catch (error) {
    console.error("[DB] resetDatabase error:", error)
    return false
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
