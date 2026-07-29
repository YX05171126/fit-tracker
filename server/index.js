/**
 * FitTracker Unified Server
 * Express — API + 前端静态文件
 */
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { findUserByUsername, findUserById, createUser, getUserData, setUserData, getUserArray, setUserArray } from './store.js'
import { signToken, authMiddleware, adminMiddleware } from './auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3001
const DIST_DIR = path.join(__dirname, '..', 'dist')

// 生产环境安全检查
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET 环境变量未设置，服务器拒绝启动')
  process.exit(1)
}

// ─── 静态文件 (前端 build) ──────────────────
app.use(express.static(DIST_DIR, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript')
    if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css')
    if (filePath.endsWith('.html')) {
      // index.html 不缓存，确保更新后立即生效
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
    }
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
    const user = findUserById(req.userId)
    const data = {
      user: user ? { id: user.id, username: user.username } : null,
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

// ─── 拍照识别食物 ──────────────────────────
// POST /api/scan-food  body: { image: "base64..." }
// 支持通义千问 Qwen-VL（国内可用，免费额度）和 Gemini
const AI_API_KEY = process.env.AI_API_KEY || process.env.DASHSCOPE_API_KEY || ''
const AI_PROVIDER = process.env.AI_PROVIDER || 'qwen' // qwen | gemini

/**
 * 从 AI 返回文本中提取 JSON 数组
 * 支持多种格式：纯 JSON、markdown 代码块、带文字前缀
 */
function extractJSON(text) {
  if (!text) return null
  // 1. 尝试匹配 markdown 代码块中的 JSON
  const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (mdMatch) {
    const parsed = tryParse(mdMatch[1])
    if (parsed) return parsed
  }
  // 2. 尝试匹配最外层的 JSON 数组
  const arrMatch = text.match(/\[[\s\S]*\]/)
  if (arrMatch) {
    const parsed = tryParse(arrMatch[0])
    if (parsed) return parsed
  }
  // 3. 尝试匹配 JSON 对象（单个食物，非贪婪避免跨对象匹配）
  const objMatch = text.match(/\{[\s\S]*?\}/)
  if (objMatch) {
    const parsed = tryParse(objMatch[0])
    if (parsed && !Array.isArray(parsed)) return [parsed]
    if (Array.isArray(parsed)) return parsed
  }
  return null
}

function tryParse(str) {
  try {
    return JSON.parse(str)
  } catch (_) {
    return null
  }
}

/**
 * 清洗和校验 AI 返回的食物条目
 */
function normalizeItems(rawItems) {
  if (!Array.isArray(rawItems)) return []
  return rawItems
    .filter(item => item && item.name && typeof item.name === 'string')
    .map(item => ({
      name: item.name.trim(),
      kcal: clampNumber(item.kcal, 0, 2000, 100),
      protein: clampNumber(item.protein, 0, 200, 5),
      fat: clampNumber(item.fat, 0, 200, 5),
      carbs: clampNumber(item.carbs, 0, 300, 10),
      portion: item.portion || estimatePortion(item.name),
    }))
    .filter(item => item.name.length > 0 && item.name.length < 50)
}

function clampNumber(val, min, max, fallback) {
  const n = Number(val)
  if (isNaN(n) || n < min || n > max) return fallback
  return Math.round(n)
}

function estimatePortion(name) {
  const n = name.toLowerCase()
  // 面点类 — 容易低估的
  if (n.includes('小笼') || n.includes('汤包') || n.includes('蒸饺')) return '1笼(8个/250g)'
  if (n.includes('生煎') || n.includes('锅贴') || n.includes('煎饺')) return '4个(200g)'
  if (n.includes('烧卖') || n.includes('虾饺') || n.includes('干蒸')) return '4个(150g)'
  if (n.includes('包') && (n.includes('肉') || n.includes('叉烧'))) return '2个(150g)'
  if (n.includes('饺')) return '10个(200g)'
  if (n.includes('馄饨') || n.includes('云吞')) return '1碗(200g)'
  if (n.includes('饼') || n.includes('煎饼')) return '1张(100g)'
  // 主食
  if (n.includes('饭') || n.includes('面') || n.includes('粉') || n.includes('粥') || n.includes('米线')) return '1碗'
  // 肉类
  if (n.includes('鸡') || n.includes('肉') || n.includes('鱼') || n.includes('虾') || n.includes('排')) return '1份(150g)'
  // 其他
  if (n.includes('蛋')) return '1个'
  if (n.includes('奶') || n.includes('浆') || n.includes('汁')) return '1杯(250ml)'
  if (n.includes('果')) return '1个'
  if (n.includes('菜') || n.includes('蔬')) return '1份(200g)'
  if (n.includes('汤')) return '1碗(250ml)'
  if (n.includes('丸')) return '6个(150g)'
  return '1份'
}

app.post('/api/scan-food', authMiddleware, async (req, res) => {
  try {
    const { image } = req.body
    if (!image) return res.status(400).json({ error: '缺少图片数据' })
    if (!AI_API_KEY) {
      return res.json({
        mode: 'no_key',
        message: '需要配置 AI API Key。免费获取: dashscope.aliyuncs.com (通义千问) 或 aistudio.google.com (Gemini)',
        items: [],
      })
    }

    // ── 更精准的 AI Prompt ──
    const prompt = `你是专业营养分析师。请仔细观察图片中的食物，按以下标准估算每份的营养成分：

⚠️ 重要提醒（避免低估）：
- 小笼包/生煎包/汤包：含猪肉+皮冻汤汁，1笼(8个)约 400-500 kcal，不是低卡食物！
- 饺子/锅贴/煎饺：10个约 400-450 kcal
- 肉包子：1个约 180-220 kcal
- 烧卖/虾饺：4个约 200-300 kcal
- 炒饭/炒面/炒粉：1份约 400-550 kcal
- 红烧肉/扣肉/五花肉：1份(100g)约 350-400 kcal
- 油炸食物（炸鸡/春卷/油条等）：热量是蒸煮的 2-3 倍
- 含酱汁/红油的菜肴：额外增加 50-100 kcal

返回格式（只返回JSON数组，不要markdown，不要说明文字）：
[{"name":"食物名称","kcal":总热量,"protein":蛋白质克数,"fat":脂肪克数,"carbs":碳水克数,"portion":"1份的份量描述"}]

示例：
[{"name":"小笼包","kcal":450,"protein":22,"fat":25,"carbs":38,"portion":"1笼(8个)"}]
[{"name":"白米饭","kcal":174,"protein":3.9,"fat":0.4,"carbs":38.9,"portion":"1碗(150g)"}]`

    let rawText = ''

    if (AI_PROVIDER === 'gemini') {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${AI_API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [
              { text: prompt },
              { inlineData: { mimeType: 'image/jpeg', data: image } },
            ]}],
            generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
          }) },
      )
      if (!resp.ok) {
        const errText = await resp.text().catch(() => '')
        console.error('[scan-food] Gemini API error:', resp.status, errText.slice(0, 200))
        return res.status(502).json({ error: 'AI 服务异常，请稍后重试' })
      }
      const data = await resp.json()
      rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } else {
      // 通义千问 Qwen-VL（国内可用，免费额度高）
      const resp = await fetch(
        'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        { method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_API_KEY}` },
          body: JSON.stringify({
            model: 'qwen-vl-plus',
            max_tokens: 1024,
            temperature: 0.3,
            messages: [{ role: 'user', content: [
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
              { type: 'text', text: prompt },
            ]}],
          }) },
      )
      if (!resp.ok) {
        const errText = await resp.text().catch(() => '')
        console.error('[scan-food] Qwen API error:', resp.status, errText.slice(0, 200))
        return res.status(502).json({ error: 'AI 服务异常，请稍后重试' })
      }
      const data = await resp.json()
      rawText = data?.choices?.[0]?.message?.content || ''
    }

    // ── 提取 & 清洗 JSON ──
    const rawItems = extractJSON(rawText) || []
    const items = normalizeItems(rawItems)

    console.log(`[scan-food] AI raw text: ${rawText.slice(0, 150)}... → ${items.length} items`)

    if (items.length === 0 && rawText) {
      // AI 返回了内容但未能解析 —— 尝试把整个文本当食物名
      const fallbackName = rawText.trim().slice(0, 30)
      if (fallbackName && !fallbackName.startsWith('```') && !fallbackName.startsWith('[')) {
        return res.json({
          mode: 'ai',
          items: [{ name: fallbackName, kcal: 150, protein: 10, fat: 8, carbs: 12, portion: '1份' }],
        })
      }
    }

    res.json({ mode: 'ai', items })
  } catch (e) {
    console.error('[scan-food] Unexpected error:', e.message)
    res.status(500).json({ error: '识别失败，服务器内部错误' })
  }
})

// ─── Admin: 后台数据概览 ─────────────────────
// 浏览器访问 /api/admin 查看所有用户数据
app.get('/api/admin', adminMiddleware, (req, res) => {
  try {
    const dataDir = path.join(__dirname, 'data')
    const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf-8'))

    const summary = {
      totalUsers: users.length,
      users: users.map(u => {
        const profile = getUserData(u.id, 'profile.json')
        const foodLogs = getUserData(u.id, 'food_logs.json')
        const foodDays = Object.keys(foodLogs).length
        const exerciseLogs = getUserData(u.id, 'exercise_logs.json')
        const exerciseDays = Object.keys(exerciseLogs).length
        const waterLogs = getUserData(u.id, 'water_logs.json')
        const weightLogs = getUserArray(u.id, 'weight_logs.json')

        return {
          username: u.username,
          createdAt: u.createdAt,
          profile: Object.keys(profile).length > 0 ? {
            gender: profile.gender,
            age: profile.age,
            weight: profile.weightKg + 'kg',
            height: profile.heightCm + 'cm',
            activity: profile.activityLevel,
          } : null,
          stats: {
            foodRecordDays: foodDays,
            exerciseRecordDays: exerciseDays,
            weightRecords: weightLogs.length,
            waterRecords: Object.keys(waterLogs).length,
          },
        }
      }),
    }
    res.json(summary)
  } catch (e) {
    res.status(500).json({ error: '读取失败' })
  }
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
