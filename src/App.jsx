import React, { useState, useMemo, useEffect, useRef } from 'react'
import useLocalStorage from './hooks/useLocalStorage'
import { calculateTDEE, calculateMacros, estimateFatLoss, calculateBMI } from './utils/tdee'
import Dashboard from './components/Dashboard'
import FoodDiary from './components/FoodDiary'
import Progress from './components/Progress'
import Profile from './components/Profile'
import Guide from './components/Guide'
import LoginPage from './components/LoginPage'
import { useAuth } from './context/AuthContext'
import { api } from './api/client'

const TABS = [
  { key: 'dashboard', label: '今日', icon: '📊' },
  { key: 'diary',     label: '记录', icon: '🍽️' },
  { key: 'progress',  label: '趋势', icon: '📈' },
  { key: 'guide',     label: '指南', icon: '💡' },
  { key: 'profile',   label: '我的', icon: '👤' },
]

const DEFAULT_PROFILE = {
  gender: 'male',
  age: 25,
  weightKg: 75,
  heightCm: 175,
  activityLevel: 'sedentary',
  bodyFatPct: '',
  formula: 'mifflin',
}

// 生成今天的日期 key
function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function App() {
  const { user, loading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [profile, setProfile] = useLocalStorage('ft_profile', DEFAULT_PROFILE)
  const [foodLogs, setFoodLogs] = useLocalStorage('ft_food_logs', {})
  const [weightLogs, setWeightLogs] = useLocalStorage('ft_weight_logs', [])
  const [measureLogs, setMeasureLogs] = useLocalStorage('ft_measure_logs', [])
  const [customFoods, setCustomFoods] = useLocalStorage('ft_custom_foods', [])
  const [showSetup, setShowSetup] = useLocalStorage('ft_setup_done', false)
  const [exerciseLogs, setExerciseLogs] = useLocalStorage('ft_exercise_logs', {})
  const [waterLogs, setWaterLogs] = useLocalStorage('ft_water_logs', {})
  const [fastingConfig, setFastingConfig] = useLocalStorage('ft_fasting_config', null)

  // ─── 计算 TDEE & 目标 ──────────────────────
  const tdeeData = useMemo(() => calculateTDEE(profile), [profile])
  const macros = useMemo(() => calculateMacros(tdeeData.targetCalories, profile.weightKg), [tdeeData.targetCalories, profile.weightKg])

  // ─── 今日饮食数据 ──────────────────────────
  const today = todayKey()
  const todayLog = foodLogs[today] || { meals: { breakfast: [], lunch: [], dinner: [], snack: [] } }

  const todayTotals = useMemo(() => {
    let kcal = 0, protein = 0, fat = 0, carbs = 0
    Object.values(todayLog.meals).forEach(items => {
      items.forEach(item => {
        kcal += item.kcal || 0
        protein += item.protein || 0
        fat += item.fat || 0
        carbs += item.carbs || 0
      })
    })
    return { kcal, protein, fat, carbs }
  }, [todayLog])

  // ─── 今日运动数据 ──────────────────────────
  const todayExercises = exerciseLogs[today] || []
  const exerciseKcalToday = useMemo(() => {
    return todayExercises.reduce((sum, e) => sum + (e.kcalBurned || 0), 0)
  }, [todayExercises])

  // ─── 今日饮水 ──────────────────────────────
  const todayWater = waterLogs[today] || 0
  const waterGoal = profile.waterGoal || 2000

  const addWater = (ml) => {
    setWaterLogs(prev => ({
      ...prev,
      [today]: (prev[today] || 0) + ml,
    }))
  }

  const resetWater = () => {
    setWaterLogs(prev => ({
      ...prev,
      [today]: 0,
    }))
  }

  // ─── 修改饮食记录 ──────────────────────────
  const addFood = (mealType, food, portions = 1) => {
    const item = {
      id: Date.now(),
      foodId: food.id,
      name: food.name,
      unit: food.unit,
      kcal: Math.round(food.kcal * portions),
      protein: +(food.p * portions).toFixed(1),
      fat: +(food.f * portions).toFixed(1),
      carbs: +(food.c * portions).toFixed(1),
      portions,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    setFoodLogs(prev => {
      const day = prev[today] || { meals: { breakfast: [], lunch: [], dinner: [], snack: [] } }
      return {
        ...prev,
        [today]: {
          ...day,
          meals: {
            ...day.meals,
            [mealType]: [...(day.meals[mealType] || []), item],
          },
        },
      }
    })
  }

  const removeFood = (mealType, itemId) => {
    setFoodLogs(prev => {
      const day = prev[today]
      if (!day) return prev
      return {
        ...prev,
        [today]: {
          ...day,
          meals: {
            ...day.meals,
            [mealType]: day.meals[mealType].filter(f => f.id !== itemId),
          },
        },
      }
    })
  }

  // ─── 添加自定义食物 ────────────────────────
  const addCustomFood = (food) => {
    setCustomFoods(prev => [...prev, { ...food, id: 'custom_' + Date.now() }])
  }

  // ─── 更新体重 ──────────────────────────────
  const addWeight = (weight) => {
    setWeightLogs(prev => {
      const existing = prev.find(w => w.date === today)
      if (existing) {
        return prev.map(w => w.date === today ? { ...w, weight } : w)
      }
      return [...prev, { date: today, weight }]
    })
    // 同步更新 profile 体重
    setProfile(prev => ({ ...prev, weightKg: weight }))
  }

  // ─── 更新围度 ──────────────────────────────
  const addMeasurements = (data) => {
    setMeasureLogs(prev => {
      const existing = prev.find(m => m.date === today)
      if (existing) {
        return prev.map(m => m.date === today ? { ...m, ...data } : m)
      }
      return [...prev, { date: today, ...data }]
    })
  }

  // ─── 运动记录 ──────────────────────────────
  const addExercise = (exerciseData) => {
    const item = {
      id: Date.now(),
      exerciseId: exerciseData.exerciseId,
      name: exerciseData.name,
      durationMin: exerciseData.durationMin,
      met: exerciseData.met,
      kcalBurned: Math.round(exerciseData.met * profile.weightKg * (exerciseData.durationMin / 60)),
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    setExerciseLogs(prev => ({
      ...prev,
      [today]: [...(prev[today] || []), item],
    }))
  }

  const removeExercise = (itemId) => {
    setExerciseLogs(prev => {
      const day = prev[today]
      if (!day) return prev
      return { ...prev, [today]: day.filter(e => e.id !== itemId) }
    })
  }

  // ─── 自动同步到服务器（防抖 2 秒）────────────────
  const saveTimer = useRef(null)
  useEffect(() => {
    if (!user) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      api.saveProfile(profile).catch(() => {})
      api.saveFoodLogs(foodLogs).catch(() => {})
      api.saveExerciseLogs(exerciseLogs).catch(() => {})
      api.saveWeightLogs(weightLogs).catch(() => {})
      api.saveMeasureLogs(measureLogs).catch(() => {})
      api.saveCustomFoods(customFoods).catch(() => {})
      api.saveWaterLogs(waterLogs).catch(() => {})
      api.saveFastingConfig(fastingConfig).catch(() => {})
    }, 2000)
    return () => clearTimeout(saveTimer.current)
  }, [profile, foodLogs, exerciseLogs, weightLogs, measureLogs, customFoods, waterLogs, fastingConfig])

  // ─── 认证守卫 ──────────────────────────────
  if (loading) {
    return <div className="app"><div className="login-page"><div className="login-card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48 }}>⏳</div><p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>加载中...</p>
    </div></div></div>
  }
  if (!user) {
    return <LoginPage />
  }

  // ─── 不显示引导页就不渲染 ──────────────────
  if (!showSetup) {
    return <Profile
      profile={profile}
      setProfile={setProfile}
      tdeeData={tdeeData}
      macros={macros}
      onDone={() => setShowSetup(true)}
      isSetup
    />
  }

  return (
    <div className="app">
      {/* 顶部状态栏 */}
      <header className="app-header">
        <span className="header-title">FitTracker</span>
        <span className="header-subtitle">科学减脂助手</span>
      </header>

      {/* 主内容区 */}
      <main className="app-main">
        {activeTab === 'dashboard' && (
          <Dashboard
            tdeeData={tdeeData}
            macros={macros}
            todayTotals={todayTotals}
            todayLog={todayLog}
            profile={profile}
            exerciseKcalToday={exerciseKcalToday}
            todayWater={todayWater}
            waterGoal={waterGoal}
            onAddWater={addWater}
            onResetWater={resetWater}
            fastingConfig={fastingConfig}
            onSetFastingConfig={setFastingConfig}
          />
        )}
        {activeTab === 'diary' && (
          <FoodDiary
            todayLog={todayLog}
            onAddFood={addFood}
            onRemoveFood={removeFood}
            onAddCustomFood={addCustomFood}
            customFoods={customFoods}
            tdeeData={tdeeData}
            macros={macros}
            todayTotals={todayTotals}
            todayExercises={todayExercises}
            exerciseKcalToday={exerciseKcalToday}
            onAddExercise={addExercise}
            onRemoveExercise={removeExercise}
            profile={profile}
          />
        )}
        {activeTab === 'progress' && (
          <Progress
            weightLogs={weightLogs}
            foodLogs={foodLogs}
            tdeeData={tdeeData}
            addWeight={addWeight}
            addMeasurements={addMeasurements}
            measureLogs={measureLogs}
            profile={profile}
          />
        )}
        {activeTab === 'guide' && (
          <Guide
            tdeeData={tdeeData}
            macros={macros}
            todayTotals={todayTotals}
            todayLog={todayLog}
            profile={profile}
            todayExercises={todayExercises}
            exerciseKcalToday={exerciseKcalToday}
            weightLogs={weightLogs}
            exerciseLogs={exerciseLogs}
            foodLogs={foodLogs}
            todayWater={todayWater}
            waterGoal={waterGoal}
          />
        )}
        {activeTab === 'profile' && (
          <Profile
            profile={profile}
            setProfile={setProfile}
            tdeeData={tdeeData}
            macros={macros}
            weightLogs={weightLogs}
            onLogout={logout}
          />
        )}
      </main>

      {/* 底部标签栏 */}
      <nav className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
