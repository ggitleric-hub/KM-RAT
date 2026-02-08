// t.me/SentinelLinks

// SQLite Database Management Library (without license keys)
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

// Database API client
class DatabaseClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = "/api/db"
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params }),
    })

    // t.me/SentinelLinks
    if (!response.ok) {
      throw new Error("Database query failed")
    }

    const data = await response.json()
    return data.rows || []
  }

  async execute(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid: number }> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params, execute: true }),
    })

    // t.me/SentinelLinks
    if (!response.ok) {
      throw new Error("Database execution failed")
    }

    return await response.json()
  }
}

export const db = new DatabaseClient()

// User Management
export async function getUsers(): Promise<User[]> {
  return await db.query<User>("SELECT * FROM users")
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const users = await db.query<User>("SELECT * FROM users WHERE username = ? COLLATE NOCASE", [username])
  return users[0] || null
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await db.query<User>("SELECT * FROM users WHERE id = ?", [id])
  return users[0] || null
}

// t.me/SentinelLinks
export async function createUser(username: string, password: string): Promise<User | null> {
  const existing = await getUserByUsername(username)
  if (existing) return null

  const newUser = {
    id: uuidv4(),
    username,
    password,
    is_admin: 0,
    uid: uuidv4(),
    blocked: 0,
  }

  await db.execute(
    `INSERT INTO users (id, username, password, is_admin, uid, blocked) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [newUser.id, newUser.username, newUser.password, newUser.is_admin, newUser.uid, newUser.blocked],
  )

  return await getUserById(newUser.id)
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<boolean> {
  const fields = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(", ")
  const values = [...Object.values(updates), userId]

  await db.execute(`UPDATE users SET ${fields} WHERE id = ?`, values)
  return true
}

export async function deleteUser(userId: string): Promise<boolean> {
  await db.execute("DELETE FROM users WHERE id = ? AND username != 'ORIXMAN'", [userId])
  return true
}

// Device ownership
export async function setDeviceOwner(deviceId: string, userUid: string): Promise<void> {
  // Store in localStorage for client-side
  const owners = JSON.parse(localStorage.getItem("grob-device_owners") || "[]")
  const existingIndex = owners.findIndex((o: any) => o.device_id === deviceId)

  if (existingIndex >= 0) {
    owners[existingIndex].user_uid = userUid
  } else {
    owners.push({ device_id: deviceId, user_uid: userUid })
  }

  localStorage.setItem("grob-device_owners", JSON.stringify(owners))

  // Also try to store in database if available
  try {
    await db.execute("INSERT OR REPLACE INTO device_owners (device_id, user_uid) VALUES (?, ?)", [deviceId, userUid])
  } catch (error) {
    // Silent error
  }
}

export async function getDevicesByUID(uid: string): Promise<string[]> {
  // Try localStorage first
  const owners = JSON.parse(localStorage.getItem("grob-device_owners") || "[]")
  const deviceIds = owners.filter((o: any) => o.user_uid === uid).map((o: any) => o.device_id)

  if (deviceIds.length > 0) {
    return deviceIds
  }

  // Fallback to database
  try {
    const devices = await db.query<{ device_id: string }>("SELECT device_id FROM device_owners WHERE user_uid = ?", [
      uid,
    ])
    return devices.map((d) => d.device_id)
  } catch (error) {
    return deviceIds
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
