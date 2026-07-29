/**
 * FitTracker API 客户端
 * 管理 JWT token 和所有 API 请求
 */

const API_BASE = '/api'

let authToken = localStorage.getItem('ft_token')

export function getToken() { return authToken }

export function setToken(token) {
  authToken = token
  if (token) localStorage.setItem('ft_token', token)
  else localStorage.removeItem('ft_token')
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  const opts = { method, headers }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${API_BASE}${path}`, opts)
  const data = await res.json()

  if (!res.ok) {
    if (res.status === 401) setToken(null)
    throw new Error(data.error || '请求失败')
  }
  return data
}

// ─── Auth ────────────────────────────────────
export const api = {
  register: (username, password) => request('POST', '/auth/register', { username, password }),
  login: (username, password) => request('POST', '/auth/login', { username, password }),

  // Sync all data
  sync: () => request('GET', '/sync'),

  // Profile
  getProfile: () => request('GET', '/profile'),
  saveProfile: (data) => request('PUT', '/profile', data),

  // Food logs
  getFoodLogs: () => request('GET', '/food-logs'),
  saveFoodLogs: (data) => request('PUT', '/food-logs', data),

  // Exercise logs
  getExerciseLogs: () => request('GET', '/exercise-logs'),
  saveExerciseLogs: (data) => request('PUT', '/exercise-logs', data),

  // Weight logs
  getWeightLogs: () => request('GET', '/weight-logs'),
  saveWeightLogs: (data) => request('PUT', '/weight-logs', data),

  // Measure logs
  getMeasureLogs: () => request('GET', '/measure-logs'),
  saveMeasureLogs: (data) => request('PUT', '/measure-logs', data),

  // Custom foods
  getCustomFoods: () => request('GET', '/custom-foods'),
  saveCustomFoods: (data) => request('PUT', '/custom-foods', data),

  // Water logs
  getWaterLogs: () => request('GET', '/water-logs'),
  saveWaterLogs: (data) => request('PUT', '/water-logs', data),

  // Fasting config
  getFastingConfig: () => request('GET', '/fasting-config'),
  saveFastingConfig: (data) => request('PUT', '/fasting-config', data),

  // Food scan
  scanFood: (imageBase64) => request('POST', '/scan-food', { image: imageBase64 }),
}
