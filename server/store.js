/**
 * JSON 文件数据存储层
 * 每个用户的数据存在 server/data/{userId}/ 目录下
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

// 确保 data 目录存在
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]')

// ─── 用户管理 ────────────────────────────────

function getUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

export function findUserByUsername(username) {
  return getUsers().find(u => u.username === username)
}

export function findUserById(id) {
  return getUsers().find(u => u.id === id)
}

export function createUser(username, passwordHash) {
  const users = getUsers()
  const user = {
    id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  saveUsers(users)
  // 创建用户数据目录
  const userDir = path.join(DATA_DIR, user.id)
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true })
  return user
}

// ─── 用户数据读写 ────────────────────────────

function getUserFile(userId, filename) {
  const dir = path.join(DATA_DIR, userId)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, filename)
  if (!fs.existsSync(file)) fs.writeFileSync(file, '{}')
  return file
}

export function getUserData(userId, filename) {
  try {
    return JSON.parse(fs.readFileSync(getUserFile(userId, filename), 'utf-8'))
  } catch { return {} }
}

export function setUserData(userId, filename, data) {
  fs.writeFileSync(getUserFile(userId, filename), JSON.stringify(data, null, 2))
}

export function getUserArray(userId, filename) {
  try {
    return JSON.parse(fs.readFileSync(getUserFile(userId, filename), 'utf-8'))
  } catch { return [] }
}

export function setUserArray(userId, filename, arr) {
  fs.writeFileSync(getUserFile(userId, filename), JSON.stringify(arr, null, 2))
}
