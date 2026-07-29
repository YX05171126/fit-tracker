/**
 * JWT 认证中间件
 */
import jwt from 'jsonwebtoken'
import { isAdmin } from './store.js'

const JWT_SECRET = process.env.JWT_SECRET || 'fit-tracker-secret-change-in-production'
const TOKEN_EXPIRY = '30d'

export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' })
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    req.userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' })
  }
}

export function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (!isAdmin(req.userId)) {
      return res.status(403).json({ error: '需要管理员权限' })
    }
    next()
  })
}
