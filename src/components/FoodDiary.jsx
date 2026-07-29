import React, { useState, useMemo } from 'react'
import FOODS, { FOOD_CATEGORIES } from '../data/foodDatabase'
import EXERCISES, { EXERCISE_CATEGORIES, calcExerciseKcal } from '../data/exerciseDatabase'
import FoodScan from './FoodScan'

const MEAL_TYPES = [
  { key: 'breakfast', label: '早餐', emoji: '🥐' },
  { key: 'lunch',     label: '午餐', emoji: '🍱' },
  { key: 'dinner',    label: '晚餐', emoji: '🍲' },
  { key: 'snack',     label: '加餐', emoji: '🍪' },
]

export default function FoodDiary({ todayLog, foodLogs, onAddFood, onRemoveFood, onAddCustomFood, customFoods, tdeeData, macros, todayTotals, todayExercises, exerciseKcalToday, onAddExercise, onRemoveExercise, profile }) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCat, setActiveCat] = useState('全部')
  const [selectedFood, setSelectedFood] = useState(null)
  const [portions, setPortions] = useState(1)
  const [targetMeal, setTargetMeal] = useState('lunch')
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [toast, setToast] = useState(null)

  // 自定义食物表单
  const [customForm, setCustomForm] = useState({ name: '', unit: '份(100g)', kcal: '', p: '', f: '', c: '', cat: '自定义' })

  // 运动记录状态
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [exerciseCat, setExerciseCat] = useState('全部')
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [exerciseDuration, setExerciseDuration] = useState(30)

  // 拍照识别状态
  const [showScanner, setShowScanner] = useState(false)
  const [scannerTargetMeal, setScannerTargetMeal] = useState('lunch')

  const allFoods = [...FOODS, ...customFoods]

  // ── 最近常吃（从所有历史记录中提取） ──
  const recentFoods = useMemo(() => {
    const foodMap = new Map() // key: food name → { food, lastDate, count, meals }
    const sortedDates = Object.keys(foodLogs || {}).sort().reverse()

    for (const date of sortedDates) {
      const day = foodLogs[date]
      if (!day || !day.meals) continue
      for (const [mealKey, items] of Object.entries(day.meals)) {
        for (const item of items) {
          const key = item.name
          const existing = foodMap.get(key)
          if (existing) {
            existing.count += 1
            if (date > existing.lastDate) existing.lastDate = date
            if (!existing.meals.includes(mealKey)) existing.meals.push(mealKey)
          } else {
            // 尝试从数据库中匹配完整食物数据
            const dbMatch = allFoods.find(f => f.name === item.name)
            foodMap.set(key, {
              name: item.name,
              kcal: item.kcal / Math.max(1, item.portions || 1), // 还原为每份热量
              unit: item.unit || (dbMatch ? dbMatch.unit : '1份'),
              p: dbMatch ? dbMatch.p : (item.protein / Math.max(1, item.portions || 1)),
              f: dbMatch ? dbMatch.f : (item.fat / Math.max(1, item.portions || 1)),
              c: dbMatch ? dbMatch.c : (item.carbs / Math.max(1, item.portions || 1)),
              cat: dbMatch ? dbMatch.cat : '自定义',
              id: dbMatch ? dbMatch.id : ('recent_' + item.name),
              lastDate: date,
              count: 1,
              meals: [mealKey],
            })
          }
        }
      }
    }

    // 按最后出现日期排序，取前 8 个
    return Array.from(foodMap.values())
      .sort((a, b) => b.lastDate.localeCompare(a.lastDate) || b.count - a.count)
      .slice(0, 8)
  }, [foodLogs])

  // 搜索过滤
  const filteredFoods = allFoods.filter(f => {
    const matchCat = activeCat === '全部' || f.cat === activeCat
    const matchQuery = !searchQuery || f.name.includes(searchQuery) || f.cat.includes(searchQuery)
    return matchCat && matchQuery
  })

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1500)
  }

  const handleSelectFood = (food) => {
    setSelectedFood(food)
    setPortions(1)
  }

  const handleAddFood = () => {
    if (!selectedFood) return
    onAddFood(targetMeal, selectedFood, portions)
    showToast(`已添加 ${selectedFood.name} ×${portions}`)
    setSelectedFood(null)
    setPortions(1)
    setShowSearch(false)
  }

  const handleSaveCustom = () => {
    if (!customForm.name || !customForm.kcal) return
    onAddCustomFood({
      name: customForm.name,
      unit: customForm.unit,
      kcal: Number(customForm.kcal),
      p: Number(customForm.p) || 0,
      f: Number(customForm.f) || 0,
      c: Number(customForm.c) || 0,
      cat: '自定义',
    })
    showToast(`已保存 "${customForm.name}"`)
    setCustomForm({ name: '', unit: '份(100g)', kcal: '', p: '', f: '', c: '', cat: '自定义' })
    setShowCustomForm(false)
  }

  return (
    <div>
      {toast && <div className="toast">{toast}</div>}

      {/* ── 今日汇总 ── */}
      <div className="card">
        <div className="flex justify-between items-center mb-12">
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>今日已摄入</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-dark)' }}>
              {todayTotals.kcal} <span style={{ fontSize: 14, color: 'var(--text-hint)' }}>/ {tdeeData.targetCalories} kcal</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>剩余</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: tdeeData.targetCalories - todayTotals.kcal >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
              {tdeeData.targetCalories - todayTotals.kcal >= 0 ? '' : '-'}{Math.abs(tdeeData.targetCalories - todayTotals.kcal)} kcal
            </div>
          </div>
        </div>
        <div className="macro-list">
          {[
            { label: '蛋白质', current: todayTotals.protein, target: macros.protein.grams, unit: 'g', color: '#F44336' },
            { label: '脂肪',   current: todayTotals.fat,     target: macros.fat.grams,     unit: 'g', color: '#FF9800' },
            { label: '碳水',   current: todayTotals.carbs,   target: macros.carbs.grams,   unit: 'g', color: '#2196F3' },
          ].map(m => (
            <div key={m.label} className="macro-item">
              <span style={{ fontSize: 12, width: 40, fontWeight: 500 }}>{m.label}</span>
              <div className="macro-info">
                <div className="macro-bar-bg" style={{ height: 6 }}>
                  <div className="macro-bar-fg" style={{
                    height: 6,
                    width: `${Math.min(100, m.target > 0 ? m.current / m.target * 100 : 0)}%`,
                    backgroundColor: m.current > m.target ? 'var(--danger)' : m.color,
                  }} />
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 70, textAlign: 'right' }}>
                {m.current}/{m.target}{m.unit}
              </span>
            </div>
          ))}
        </div>
        <button className="btn btn-outline btn-sm btn-block mt-8"
          onClick={() => { setScannerTargetMeal('lunch'); setShowScanner(true); }}
        >
          📸 拍照识别热量
        </button>
      </div>

      {/* ── 拍照识别弹窗 ── */}
      {showScanner && (
        <FoodScan
          targetMeal={scannerTargetMeal}
          onAddFood={onAddFood}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* ── 最近常吃 ── */}
      {recentFoods.length > 0 && (
        <div className="card">
          <div className="card-title">🕐 最近常吃</div>
          <div className="recent-foods-scroll">
            {recentFoods.map((food, i) => (
              <button
                key={food.name + i}
                className="recent-food-chip"
                onClick={() => {
                  // 推测应该加到哪一餐：优先用最常出现的餐次
                  const mealHint = food.meals[0] || 'lunch'
                  setTargetMeal(mealHint)
                  // 如果食物在数据库中有完整数据，用数据库的；否则用还原的数据
                  const dbFood = allFoods.find(f => f.id === food.id)
                  if (dbFood) {
                    setSelectedFood(dbFood)
                  } else {
                    setSelectedFood({
                      id: food.id,
                      name: food.name,
                      unit: food.unit,
                      kcal: food.kcal,
                      p: food.p,
                      f: food.f,
                      c: food.c,
                      cat: food.cat,
                    })
                  }
                  setPortions(1)
                  setShowSearch(true)
                }}
                title={`${food.name} · ${food.kcal}kcal/份 · 吃过${food.count}次`}
              >
                <span className="recent-food-name">{food.name}</span>
                <span className="recent-food-kcal">{food.kcal} kcal</span>
                <span className="recent-food-count">×{food.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 正餐列表 ── */}
      {MEAL_TYPES.map(meal => {
        const items = todayLog.meals[meal.key] || []
        const mealKcal = items.reduce((s, f) => s + (f.kcal || 0), 0)
        return (
          <div key={meal.key} className="card">
            <div className="meal-header">
              <h3>{meal.emoji} {meal.label}</h3>
              <span className="meal-kcal">{mealKcal} kcal</span>
            </div>
            {items.length === 0 ? (
              <p className="text-hint" style={{ padding: '4px 0' }}>暂无记录</p>
            ) : (
              items.map(food => (
                <div key={food.id} className="food-item">
                  <div className="food-item-left">
                    <div className="food-item-name">{food.name}</div>
                    <div className="food-item-detail">
                      {food.unit} ×{food.portions || 1}
                      {' · '}P:{food.protein}g F:{food.fat}g C:{food.carbs}g
                    </div>
                  </div>
                  <div className="food-item-right">
                    <div className="food-item-kcal">{food.kcal}</div>
                    <div className="food-item-macro">kcal</div>
                  </div>
                  <button className="food-item-del" onClick={() => onRemoveFood(meal.key, food.id)}>✕</button>
                </div>
              ))
            )}
            <button
              className="btn btn-outline btn-sm btn-block mt-8"
              onClick={() => { setTargetMeal(meal.key); setShowSearch(true); setSelectedFood(null); }}
            >
              + 添加食物
            </button>
          </div>
        )
      })}

      {/* ── 运动记录 ── */}
      <div className="card">
        <div className="card-title">🏃 今日运动</div>
        <div className="flex justify-between items-center mb-8">
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            已消耗 <strong style={{ color: 'var(--warning)' }}>{exerciseKcalToday} kcal</strong>
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            净摄入: <strong>{todayTotals.kcal - exerciseKcalToday} kcal</strong>
          </span>
        </div>
        {todayExercises.length === 0 ? (
          <p className="text-hint" style={{ padding: '4px 0' }}>今天还没有记录运动</p>
        ) : (
          todayExercises.map(ex => (
            <div key={ex.id} className="exercise-item">
              <div className="exercise-item-left">
                <div className="exercise-item-name">{ex.name}</div>
                <div className="exercise-item-detail">
                  {ex.durationMin} min · MET {ex.met} · {ex.time}
                </div>
              </div>
              <div className="exercise-item-right">
                <div className="exercise-item-kcal">-{ex.kcalBurned}</div>
                <div className="exercise-item-macro">kcal</div>
              </div>
              <button className="food-item-del" onClick={() => onRemoveExercise(ex.id)}>✕</button>
            </div>
          ))
        )}
        <button
          className="btn btn-outline btn-sm btn-block mt-8"
          onClick={() => { setShowExercisePicker(true); setSelectedExercise(null); }}
        >
          + 记录运动
        </button>
      </div>

      {/* ── 运动选择器弹窗 ── */}
      {showExercisePicker && (
        <div className="search-overlay" onClick={(e) => e.target === e.currentTarget && setShowExercisePicker(false)}>
          <div className="search-panel">
            {!selectedExercise ? (
              <>
                <div className="search-header">
                  <span style={{ flex: 1, fontWeight: 600 }}>选择运动类型</span>
                  <button className="search-close" onClick={() => setShowExercisePicker(false)}>✕</button>
                </div>
                <div className="search-categories">
                  {EXERCISE_CATEGORIES.map(cat => (
                    <button key={cat}
                      className={`cat-chip ${exerciseCat === cat ? 'active' : ''}`}
                      onClick={() => setExerciseCat(cat)}
                    >{cat}</button>
                  ))}
                </div>
                <div className="search-results">
                  {EXERCISES.filter(ex => exerciseCat === '全部' || ex.cat === exerciseCat).map(ex => (
                    <div key={ex.id} className="search-food-item"
                      onClick={() => { setSelectedExercise(ex); setExerciseDuration(30); }}
                    >
                      <div>
                        <div className="search-food-name">{ex.icon} {ex.name}</div>
                        <div className="search-food-desc">MET {ex.met} · {ex.cat}</div>
                      </div>
                      <div className="search-food-kcal">
                        ~{calcExerciseKcal(ex.met, profile.weightKg, 30)} kcal/30min
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="search-header">
                  <h3 style={{ flex: 1 }}>{selectedExercise.icon} {selectedExercise.name}</h3>
                  <button className="search-close" onClick={() => setSelectedExercise(null)}>← 返回</button>
                </div>
                <div style={{ padding: '16px', textAlign: 'center' }}>
                  <p className="text-hint">MET: {selectedExercise.met} · 预计消耗: {calcExerciseKcal(selectedExercise.met, profile.weightKg, exerciseDuration)} kcal</p>
                  <p style={{ fontSize: 13, color: 'var(--text-hint)', marginTop: 4 }}>
                    消耗 = {selectedExercise.met} × {profile.weightKg}kg × ({exerciseDuration}/60)h
                  </p>
                  <div className="duration-selector" style={{ margin: '16px 0' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>时长</p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {[15, 20, 30, 45, 60].map(d => (
                        <button key={d}
                          className={`cat-chip ${exerciseDuration === d ? 'active' : ''}`}
                          style={exerciseDuration === d ? {} : { borderColor: 'var(--border)' }}
                          onClick={() => setExerciseDuration(d)}
                        >{d} min</button>
                      ))}
                    </div>
                    <div className="portion-control" style={{ justifyContent: 'center', marginTop: 12 }}>
                      <button className="portion-btn" onClick={() => setExerciseDuration(d => Math.max(5, d - 5))}>−5</button>
                      <span className="portion-value">{exerciseDuration}</span>
                      <span className="portion-unit">min</span>
                      <button className="portion-btn" onClick={() => setExerciseDuration(d => Math.min(180, d + 5))}>+5</button>
                    </div>
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--warning)' }}>
                    预计消耗 {calcExerciseKcal(selectedExercise.met, profile.weightKg, exerciseDuration)} kcal
                  </p>
                  <button className="btn btn-primary btn-block mt-12" onClick={() => {
                    onAddExercise({
                      exerciseId: selectedExercise.id,
                      name: selectedExercise.name,
                      durationMin: exerciseDuration,
                      met: selectedExercise.met,
                    })
                    setShowExercisePicker(false)
                    setSelectedExercise(null)
                  }}>
                    确认记录
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── 食物搜索弹窗 ── */}
      {showSearch && (
        <div className="search-overlay" onClick={(e) => e.target === e.currentTarget && setShowSearch(false)}>
          <div className="search-panel">
            {!selectedFood ? (
              <>
                <div className="search-header">
                  <input
                    className="search-input"
                    placeholder="搜索食物..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <button className="search-close" onClick={() => setShowSearch(false)}>✕</button>
                </div>
                <div className="search-categories">
                  {FOOD_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      className={`cat-chip ${activeCat === cat ? 'active' : ''}`}
                      onClick={() => setActiveCat(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div style={{ padding: '0 16px 8px' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowCustomForm(!showCustomForm)}>
                    {showCustomForm ? '取消' : '+ 自定义食物'}
                  </button>
                </div>
                {showCustomForm && (
                  <div className="custom-food-form">
                    <input className="form-input" placeholder="食物名称" value={customForm.name}
                      onChange={e => setCustomForm(p => ({ ...p, name: e.target.value }))} />
                    <div className="form-row">
                      <input className="form-input" placeholder="热量(kcal)" type="number" value={customForm.kcal}
                        onChange={e => setCustomForm(p => ({ ...p, kcal: e.target.value }))} />
                      <input className="form-input" placeholder="份量描述" value={customForm.unit}
                        onChange={e => setCustomForm(p => ({ ...p, unit: e.target.value }))} />
                    </div>
                    <div className="form-row">
                      <input className="form-input" placeholder="蛋白质(g)" type="number" value={customForm.p}
                        onChange={e => setCustomForm(p => ({ ...p, p: e.target.value }))} />
                      <input className="form-input" placeholder="脂肪(g)" type="number" value={customForm.f}
                        onChange={e => setCustomForm(p => ({ ...p, f: e.target.value }))} />
                      <input className="form-input" placeholder="碳水(g)" type="number" value={customForm.c}
                        onChange={e => setCustomForm(p => ({ ...p, c: e.target.value }))} />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveCustom}>保存</button>
                  </div>
                )}
                <div className="search-results">
                  {filteredFoods.map(food => (
                    <div key={food.id} className="search-food-item" onClick={() => handleSelectFood(food)}>
                      <div>
                        <div className="search-food-name">{food.name}</div>
                        <div className="search-food-desc">{food.unit} · {food.cat}</div>
                      </div>
                      <div className="search-food-kcal">{food.kcal} kcal</div>
                    </div>
                  ))}
                  {filteredFoods.length === 0 && (
                    <p className="chart-empty">没有找到匹配的食物</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="search-header">
                  <h3 style={{ flex: 1 }}>{selectedFood.name}</h3>
                  <button className="search-close" onClick={() => setSelectedFood(null)}>← 返回</button>
                </div>
                <div style={{ padding: '16px', textAlign: 'center' }}>
                  <p className="text-hint">{selectedFood.unit}</p>
                  <p style={{ fontSize: 14, marginTop: 4 }}>
                    每份: {selectedFood.kcal}kcal · P:{selectedFood.p}g · F:{selectedFood.f}g · C:{selectedFood.c}g
                  </p>
                  <div className="portion-control" style={{ justifyContent: 'center', margin: '16px 0' }}>
                    <button className="portion-btn" onClick={() => setPortions(p => Math.max(0.5, p - 0.5))}>−</button>
                    <span className="portion-value">{portions}</span>
                    <span className="portion-unit">份</span>
                    <button className="portion-btn" onClick={() => setPortions(p => p + 0.5)}>+</button>
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-dark)' }}>
                    {Math.round(selectedFood.kcal * portions)} kcal
                  </p>
                  <button className="btn btn-primary btn-block mt-12" onClick={handleAddFood}>
                    添加到 {MEAL_TYPES.find(m => m.key === targetMeal)?.label}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
