/**
 * FitTracker Unified Server
 * Express — API + 前端静态文件
 */
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { findUserByUsername, createUser, getUserData, setUserData, getUserArray, setUserArray } from './store.js'
import { signToken, authMiddleware } from './auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3001
const DIST_DIR = path.join(__dirname, '..', 'dist')

// ─── 静态文件 (前端 build) ──────────────────
app.use(express.static(DIST_DIR, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript')
    if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css')
  },
}))

// ─── 注册 ────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' })
    if (username.length < 2 || username.length > 20) return res.status(400).json({ error: '用户名需 2-20 个字符' })
    if (password.length < 4) return res.status(400).json({ error: '密码至少 4 位' })
    if (findUserByUsername(username)) return res.status(409).json({ error: '用户名已存在' })

    const hash = await bcrypt.hash(password, 10)
    const user = createUser(username, hash)
    const token = signToken(user.id)
    res.json({ token, user: { id: user.id, username: user.username } })
  } catch (e) {
    res.status(500).json({ error: '服务器错误' })
  }
})

// ─── 登录 ────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = findUserByUsername(username)
    if (!user) return res.status(401).json({ error: '用户名或密码错误' })
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: '用户名或密码错误' })
    const token = signToken(user.id)
    res.json({ token, user: { id: user.id, username: user.username } })
  } catch (e) {
    res.status(500).json({ error: '服务器错误' })
  }
})

// ─── Profile ─────────────────────────────────
app.get('/api/profile', authMiddleware, (req, res) => {
  res.json(getUserData(req.userId, 'profile.json'))
})
app.put('/api/profile', authMiddleware, (req, res) => {
  setUserData(req.userId, 'profile.json', req.body)
  res.json({ ok: true })
})

// ─── Food Logs ───────────────────────────────
app.get('/api/food-logs', authMiddleware, (req, res) => {
  res.json(getUserData(req.userId, 'food_logs.json'))
})
app.put('/api/food-logs', authMiddleware, (req, res) => {
  setUserData(req.userId, 'food_logs.json', req.body)
  res.json({ ok: true })
})

// ─── Exercise Logs ───────────────────────────
app.get('/api/exercise-logs', authMiddleware, (req, res) => {
  res.json(getUserData(req.userId, 'exercise_logs.json'))
})
app.put('/api/exercise-logs', authMiddleware, (req, res) => {
  setUserData(req.userId, 'exercise_logs.json', req.body)
  res.json({ ok: true })
})

// ─── Weight Logs ────────────────────────────
app.get('/api/weight-logs', authMiddleware, (req, res) => {
  res.json(getUserArray(req.userId, 'weight_logs.json'))
})
app.put('/api/weight-logs', authMiddleware, (req, res) => {
  setUserArray(req.userId, 'weight_logs.json', req.body)
  res.json({ ok: true })
})

// ─── Measure Logs ────────────────────────────
app.get('/api/measure-logs', authMiddleware, (req, res) => {
  res.json(getUserArray(req.userId, 'measure_logs.json'))
})
app.put('/api/measure-logs', authMiddleware, (req, res) => {
  setUserArray(req.userId, 'measure_logs.json', req.body)
  res.json({ ok: true })
})

// ─── Custom Foods ────────────────────────────
app.get('/api/custom-foods', authMiddleware, (req, res) => {
  res.json(getUserArray(req.userId, 'custom_foods.json'))
})
app.put('/api/custom-foods', authMiddleware, (req, res) => {
  setUserArray(req.userId, 'custom_foods.json', req.body)
  res.json({ ok: true })
})

// ─── Water Logs ──────────────────────────────
app.get('/api/water-logs', authMiddleware, (req, res) => {
  res.json(getUserData(req.userId, 'water_logs.json'))
})
app.put('/api/water-logs', authMiddleware, (req, res) => {
  setUserData(req.userId, 'water_logs.json', req.body)
  res.json({ ok: true })
})

// ─── Fasting Config ──────────────────────────
app.get('/api/fasting-config', authMiddleware, (req, res) => {
  const d = getUserData(req.userId, 'fasting_config.json')
  res.json(d && Object.keys(d).length > 0 ? d : null)
})
app.put('/api/fasting-config', authMiddleware, (req, res) => {
  setUserData(req.userId, 'fasting_config.json', req.body)
  res.json({ ok: true })
})

// ─── Sync ────────────────────────────────────
app.get('/api/sync', authMiddleware, (req, res) => {
  try {
    const data = {
      profile: getUserData(req.userId, 'profile.json'),
      foodLogs: getUserData(req.userId, 'food_logs.json'),
      exerciseLogs: getUserData(req.userId, 'exercise_logs.json'),
      weightLogs: getUserArray(req.userId, 'weight_logs.json'),
      measureLogs: getUserArray(req.userId, 'measure_logs.json'),
      customFoods: getUserArray(req.userId, 'custom_foods.json'),
      waterLogs: getUserData(req.userId, 'water_logs.json'),
      fastingConfig: getUserData(req.userId, 'fasting_config.json'),
    }
    data.fastingConfig = (data.fastingConfig && Object.keys(data.fastingConfig).length > 0) ? data.fastingConfig : null
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: '数据读取失败' })
  }
})

// ─── 健康检查 ─────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

// ─── SPA 回退: 非 API/静态资源路由返回 index.html ──
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  // 如果请求不是静态文件（没有文件后缀），返回 index.html
  if (!path.extname(req.path)) {
    return res.sendFile(path.join(DIST_DIR, 'index.html'))
  }
  next()
})

// ─── 启动 ────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ FitTracker running on http://localhost:${PORT}`)
})
