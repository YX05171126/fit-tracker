import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, register, error, setError } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallHint, setShowInstallHint] = useState(false)

  // PWA 安装事件
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstallHint(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    // 检查是否已经安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallHint(false) // 已安装，不显示
    }
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') {
      setShowInstallHint(false)
      setInstallPrompt(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    setLoading(true)
    setError(null)
    try {
      if (isRegister) {
        await register(username.trim(), password)
      } else {
        await login(username.trim(), password)
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🏋️</div>
        <h1 className="login-title">FitTracker</h1>
        <p className="login-subtitle">科学减脂助手</p>

        {/* PWA 安装按钮 */}
        {showInstallHint && (
          <div className="install-banner" onClick={handleInstall}>
            <span className="install-banner-icon">📲</span>
            <div className="install-banner-text">
              <strong>安装到手机</strong>
              <span>点击添加到主屏幕，像APP一样使用</span>
            </div>
            <span className="install-banner-arrow">→</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input className="form-input" type="text" placeholder="输入用户名"
              value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input className="form-input" type="password" placeholder="输入密码"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? '请稍候...' : isRegister ? '注册' : '登录'}
          </button>
        </form>

        <p className="login-switch">
          {isRegister ? '已有账号？' : '没有账号？'}
          <button className="login-switch-btn"
            onClick={() => { setIsRegister(!isRegister); setError(null) }}>
            {isRegister ? '去登录' : '去注册'}
          </button>
        </p>

        <div className="login-tips">
          <div className="login-tip-item">
            <span>📱</span> 手机浏览器打开 → 添加到主屏幕
          </div>
          <div className="login-tip-item">
            <span>🔄</span> 换设备登录同一个账号 → 数据自动同步
          </div>
        </div>
      </div>
    </div>
  )
}
