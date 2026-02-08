// t.me/SentinelLinks

// Authentication Library (without license keys)
import { v4 as uuidv4 } from "uuid"

export interface User {
  id: string
  username: string
  password: string
  isAdmin: boolean
  createdAt: string
  uid: string
  blocked: boolean
}

export interface NewsItem {
  id: string
  title: string
  content: string
  author: string
  createdAt: string
  type: "news" | "changelog"
}

// t.me/SentinelLinks
export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  rememberMe: boolean
}

// Default admin user
const DEFAULT_ADMIN: User = {
  id: "admin-001",
  username: "Admin",
  password: "14888841",
  isAdmin: true,
  createdAt: new Date().toISOString(),
  uid: "admin-uid-001",
  blocked: false,
}

// Initialize storage with default admin
export function initializeAuth(): void {
  const users = getUsers()
  const adminExists = users.some((u) => u.username === "ORIXMAN")

  if (!adminExists) {
    users.push(DEFAULT_ADMIN)
    saveUsers(users)
  }
}

// User management
export function getUsers(): User[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("grob-users")
  if (!data) {
    localStorage.setItem("grob-users", JSON.stringify([DEFAULT_ADMIN]))
    return [DEFAULT_ADMIN]
  }
  return JSON.parse(data)
}

export function saveUsers(users: User[]): void {
  localStorage.setItem("grob-users", JSON.stringify(users))
}

export function getUserByUsername(username: string): User | undefined {
  return getUsers().find((u) => u.username.toLowerCase() === username.toLowerCase())
}

export function createUser(username: string, password: string, isAdmin = false): User | null {
  const users = getUsers()
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return null // User already exists
  }

  const newUser: User = {
    id: uuidv4(),
    username,
    password,
    isAdmin,
    createdAt: new Date().toISOString(),
    uid: uuidv4(),
    blocked: false,
  }

  users.push(newUser)
  saveUsers(users)
  return newUser
}

export function updateUser(userId: string, updates: Partial<User>): boolean {
  const users = getUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index === -1) return false

  users[index] = { ...users[index], ...updates }
  saveUsers(users)
  return true
}

export function deleteUser(userId: string): boolean {
  const users = getUsers()
  const filtered = users.filter((u) => u.id !== userId && u.username !== "ORIXMAN")
  if (filtered.length === users.length) return false
  saveUsers(filtered)
  return true
}

export function blockUser(userId: string, blocked: boolean): boolean {
  return updateUser(userId, { blocked })
}

export function toggleAdminRole(userId: string, isAdmin: boolean): boolean {
  const users = getUsers()
  const user = users.find((u) => u.id === userId)
  if (!user || user.username === "ORIXMAN") return false // Cannot modify root admin
  return updateUser(userId, { isAdmin })
}

// Authentication
export function login(username: string, password: string, rememberMe: boolean): AuthState {
  const user = getUserByUsername(username)

  if (!user || user.password !== password) {
    return { isAuthenticated: false, user: null, rememberMe: false }
  }

  if (user.blocked) {
    return { isAuthenticated: false, user: null, rememberMe: false }
  }

  const authState: AuthState = {
    isAuthenticated: true,
    user,
    rememberMe,
  }

  if (rememberMe) {
    localStorage.setItem("grob-auth", JSON.stringify(authState))
  } else {
    sessionStorage.setItem("grob-auth", JSON.stringify(authState))
  }

  return authState
}

export function logout(): void {
  localStorage.removeItem("grob-auth")
  sessionStorage.removeItem("grob-auth")
}

export function getAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, user: null, rememberMe: false }
  }

  // Check localStorage first (remember me)
  const localAuth = localStorage.getItem("grob-auth")
  if (localAuth) {
    const state = JSON.parse(localAuth) as AuthState
    // Verify user still exists and not blocked
    const user = getUserByUsername(state.user?.username || "")
    if (user && !user.blocked) {
      return { ...state, user }
    }
    localStorage.removeItem("grob-auth")
  }

  // Check sessionStorage
  const sessionAuth = sessionStorage.getItem("grob-auth")
  if (sessionAuth) {
    const state = JSON.parse(sessionAuth) as AuthState
    const user = getUserByUsername(state.user?.username || "")
    if (user && !user.blocked) {
      return { ...state, user }
    }
    sessionStorage.removeItem("grob-auth")
  }

  return { isAuthenticated: false, user: null, rememberMe: false }
}

export function getUpdatedAuthState(): AuthState {
  const users = getUsers()
  const storedAuth = localStorage.getItem("grob-auth") || sessionStorage.getItem("grob-auth")

  if (storedAuth) {
    const auth = JSON.parse(storedAuth) as AuthState
    const user = users.find(u => u.id === auth.user?.id)
    if (user && !user.blocked) {
      return { ...auth, user }
    }
  }

  return { isAuthenticated: false, user: null, rememberMe: false }
}

// Device/Build ownership
export function getDevicesByUID(uid: string, showAll = false): string[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("grob-device-owners")
  const owners: Record<string, string> = data ? JSON.parse(data) : {}

  if (showAll) {
    return Object.keys(owners)
  }

  const userDevices = Object.entries(owners)
    .filter(([_, ownerUid]) => ownerUid === uid)
    .map(([deviceId]) => deviceId)

  return userDevices
}

export function setDeviceOwner(deviceId: string, uid: string): void {
  if (typeof window === "undefined") return

  const data = localStorage.getItem("grob-device-owners")
  const owners: Record<string, string> = data ? JSON.parse(data) : {}
  owners[deviceId] = uid
  localStorage.setItem("grob-device-owners", JSON.stringify(owners))
}

// News Management
export function getNews(): NewsItem[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("grob-news")
  return data ? JSON.parse(data) : []
}

export function saveNews(news: NewsItem[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem("grob-news", JSON.stringify(news))
}

export function createNews(title: string, content: string, author: string, type: "news" | "changelog"): NewsItem {
  const newItem: NewsItem = {
    id: uuidv4(),
    title,
    content,
    author,
    createdAt: new Date().toISOString(),
    type,
  }

  const items = getNews()
  items.unshift(newItem)
  saveNews(items)
  return newItem
}

export function deleteNews(id: string): boolean {
  const items = getNews()
  const filtered = items.filter((item) => item.id !== id)
  if (filtered.length === items.length) return false
  saveNews(filtered)
  return true
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
