import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, setToken, getToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 启动时尝试自动登录
  useEffect(() => {
    const token = getToken()
    if (token) {
      api.sync()
        .then(data => {
          // 将服务端数据写入 localStorage
          if (data.profile && Object.keys(data.profile).length > 0) localStorage.setItem('ft_profile', JSON.stringify(data.profile))
          if (data.foodLogs) localStorage.setItem('ft_food_logs', JSON.stringify(data.foodLogs))
          if (data.exerciseLogs) localStorage.setItem('ft_exercise_logs', JSON.stringify(data.exerciseLogs))
          if (data.weightLogs) localStorage.setItem('ft_weight_logs', JSON.stringify(data.weightLogs))
          if (data.measureLogs) localStorage.setItem('ft_measure_logs', JSON.stringify(data.measureLogs))
          if (data.customFoods) localStorage.setItem('ft_custom_foods', JSON.stringify(data.customFoods))
          if (data.waterLogs) localStorage.setItem('ft_water_logs', JSON.stringify(data.waterLogs))
          if (data.fastingConfig) localStorage.setItem('ft_fasting_config', JSON.stringify(data.fastingConfig))
          localStorage.setItem('ft_setup_done', 'true')
          setUser(data.user || { username: '用户' })
          setLoading(false)
        })
        .catch(() => {
          setToken(null)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (username, password) => {
    setError(null)
    const result = await api.login(username, password)
    setToken(result.token)
    // 登录后同步数据
    const data = await api.sync()
    if (data.profile && Object.keys(data.profile).length > 0) localStorage.setItem('ft_profile', JSON.stringify(data.profile))
    if (data.foodLogs) localStorage.setItem('ft_food_logs', JSON.stringify(data.foodLogs))
    if (data.exerciseLogs) localStorage.setItem('ft_exercise_logs', JSON.stringify(data.exerciseLogs))
    if (data.weightLogs) localStorage.setItem('ft_weight_logs', JSON.stringify(data.weightLogs))
    if (data.measureLogs) localStorage.setItem('ft_measure_logs', JSON.stringify(data.measureLogs))
    if (data.customFoods) localStorage.setItem('ft_custom_foods', JSON.stringify(data.customFoods))
    if (data.waterLogs) localStorage.setItem('ft_water_logs', JSON.stringify(data.waterLogs))
    if (data.fastingConfig) localStorage.setItem('ft_fasting_config', JSON.stringify(data.fastingConfig))
    localStorage.setItem('ft_setup_done', (data.profile && Object.keys(data.profile).length > 0) ? 'true' : 'false')
    setUser(result.user)
  }, [])

  const register = useCallback(async (username, password) => {
    setError(null)
    const result = await api.register(username, password)
    setToken(result.token)
    localStorage.setItem('ft_setup_done', 'false')
    setUser(result.user)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    localStorage.clear()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
