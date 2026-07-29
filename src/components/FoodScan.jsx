import React, { useState, useRef, useEffect, useCallback } from 'react'
import { api } from '../api/client'

// 拍摄引导提示
const SCAN_TIPS = [
  '📸 将食物放在纯色背景上',
  '💡 确保光线充足、避免阴影',
  '📐 从正上方垂直拍摄',
  '🍽️ 每张照片只拍一道菜',
  '🔍 保持清晰、不要手抖',
]

export default function FoodScan({ targetMeal, onAddFood, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [captured, setCaptured] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState(null)
  const [selected, setSelected] = useState({})
  const [error, setError] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState('environment')
  const [torchOn, setTorchOn] = useState(false)
  const [showTips, setShowTips] = useState(true)
  const [scanStep, setScanStep] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [editingIndex, setEditingIndex] = useState(null) // 正在编辑的结果卡片索引
  const [resultPortions, setResultPortions] = useState({}) // 每个结果的份数 { index: number }

  // 扫描步骤文案
  const scanSteps = ['📤 上传图片...', '🤖 AI 分析中...', '📊 识别食物成分...', '✅ 整理结果...']

  // 启动摄像头
  useEffect(() => {
    startCamera(facingMode)
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()) }
  }, [facingMode])

  const startCamera = async (mode = 'environment') => {
    try {
      // 先停掉旧的流
      if (stream) stream.getTracks().forEach(t => t.stop())
      setCameraReady(false)
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        videoRef.current.onloadedmetadata = () => setCameraReady(true)
      }
    } catch (e) {
      if (mode === 'environment') {
        // 后置摄像头失败，尝试前置
        try {
          const s = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          })
          setStream(s)
          setFacingMode('user')
          if (videoRef.current) {
            videoRef.current.srcObject = s
            videoRef.current.onloadedmetadata = () => setCameraReady(true)
          }
          return
        } catch (_) {}
      }
      setError('无法打开摄像头。请确认已授权相机权限，或在系统设置中允许访问相机。')
    }
  }

  // 切换前后摄像头
  const flipCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newMode)
    setTorchOn(false) // 前置摄像头不支持手电筒
  }

  // 手电筒开关
  const toggleTorch = useCallback(async () => {
    if (!stream) return
    try {
      const track = stream.getVideoTracks()[0]
      if (!track) return
      // @ts-ignore — Torch API 仅在支持的设备上可用
      const capabilities = track.getCapabilities ? track.getCapabilities() : null
      if (capabilities && capabilities.torch) {
        await track.applyConstraints({ advanced: [{ torch: !torchOn }] })
        setTorchOn(!torchOn)
      }
    } catch (_) {
      // 设备不支持手电筒，静默失败
    }
  }, [stream, torchOn])

  // 拍照
  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    // 缩放到最大 1024px，减少上传数据量（AI 识别不需要全分辨率）
    const MAX_SIZE = 1024
    let { videoWidth: w, videoHeight: h } = video
    if (w > h && w > MAX_SIZE) {
      h = Math.round(h * MAX_SIZE / w)
      w = MAX_SIZE
    } else if (h > MAX_SIZE) {
      w = Math.round(w * MAX_SIZE / h)
      h = MAX_SIZE
    }
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, w, h)
    // 压缩质量 — 平衡清晰度和上传速度
    const dataUrl = canvas.toDataURL('image/jpeg', 0.65)
    setCaptured(dataUrl)
    setError(null)
    // 停止摄像头省电
    if (stream) stream.getTracks().forEach(t => t.stop())
  }

  // 重拍
  const retake = () => {
    setCaptured(null)
    setResults(null)
    setSelected({})
    setError(null)
    setScanStep(0)
    startCamera(facingMode)
  }

  // 发送到后端识别
  const scan = async () => {
    if (!captured) return
    setScanning(true)
    setError(null)
    setScanStep(1)

    // 动画步进
    const stepTimer = setInterval(() => {
      setScanStep(prev => Math.min(prev + 1, scanSteps.length - 1))
    }, 900)

    try {
      const base64 = captured.split(',')[1]
      const data = await api.scanFood(base64)

      clearInterval(stepTimer)
      setScanStep(scanSteps.length) // 完成

      if (data.mode === 'no_key') {
        setError('⚠️ 需要配置 AI API Key。在 Railway 后台添加 AI_API_KEY 环境变量即可免费使用通义千问视觉识别。')
      } else if (data.mode === 'local_fallback') {
        setResults(data.items)
        setSelected({})
        if (data.items.length > 0) {
          setError(null)
        } else {
          setError('AI 服务暂不可用，本地匹配也未找到对应食物。请尝试更清晰的照片或手动记录。')
        }
      } else {
        setResults(data.items)
        setSelected({})
      }
    } catch (e) {
      clearInterval(stepTimer)
      setError('网络异常，识别失败。请检查网络连接后重试。')
    }
    setScanning(false)
  }

  // 选中/取消食物
  const toggleFood = (index) => {
    setSelected(prev => {
      const next = { ...prev }
      if (next[index]) delete next[index]
      else next[index] = true
      return next
    })
  }

  // 全选
  const selectAll = () => {
    if (!results) return
    const all = {}
    results.forEach((_, i) => { all[i] = true })
    setSelected(all)
  }

  // 编辑单个食物字段
  const updateFoodField = (index, field, value) => {
    setResults(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  // 调整食物份数
  const adjustPortion = (index, delta) => {
    setResultPortions(prev => ({
      ...prev,
      [index]: Math.max(0.5, (prev[index] || 1) + delta),
    }))
  }

  // 结束编辑
  const finishEditing = () => {
    setEditingIndex(null)
  }

  // 添加选中的食物
  const addSelected = () => {
    const indices = Object.keys(selected).map(Number)
    const toAdd = indices.map(i => ({ food: results[i], portions: resultPortions[i] || 1 }))
    if (toAdd.length === 0) return
    const timestamp = Date.now()
    toAdd.forEach(({ food, portions }, idx) => {
      onAddFood(targetMeal, {
        id: `scanned_${timestamp}_${idx}`,
        name: food.name,
        unit: food.portion || '1份',
        kcal: Math.round((food.kcal || 0) * portions),
        p: +((food.protein || 0) * portions).toFixed(1),
        f: +((food.fat || 0) * portions).toFixed(1),
        c: +((food.carbs || 0) * portions).toFixed(1),
        cat: '拍照识别',
      }, 1)
    })
    onClose()
  }

  // 判断是否有置信度信息（AI 可能返回）
  const hasConfidence = results && results.some(f => f.confidence !== undefined)
  const getConfidenceLevel = (confidence) => {
    if (confidence === undefined) return null
    if (confidence >= 0.8) return { label: '高', cls: 'high' }
    if (confidence >= 0.5) return { label: '中', cls: 'medium' }
    return { label: '低', cls: 'low' }
  }

  return (
    <div className="scan-overlay">
      <div className="scan-container">
        {/* 头部 */}
        <div className="scan-header">
          <button className="scan-close-btn" onClick={onClose}>✕</button>
          <span className="scan-title">📸 AI 拍照识别热量</span>
          <button className="scan-info-btn" onClick={() => setShowTips(!showTips)} title="拍摄技巧">
            {showTips ? '💡' : '💡'}
          </button>
        </div>

        {/* 拍摄技巧提示 */}
        {showTips && !captured && !results && (
          <div className="scan-tips-bar">
            {SCAN_TIPS.map((tip, i) => (
              <span key={i} className="scan-tip-item">{tip}</span>
            ))}
          </div>
        )}

        {/* 摄像头 / 预览 */}
        {!captured ? (
          <div className="scan-camera">
            <video ref={videoRef} autoPlay playsInline muted className="scan-video" />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* 取景框引导线 */}
            {cameraReady && (
              <div className="scan-frame">
                <div className="scan-frame-corner scan-frame-tl" />
                <div className="scan-frame-corner scan-frame-tr" />
                <div className="scan-frame-corner scan-frame-bl" />
                <div className="scan-frame-corner scan-frame-br" />
                <span className="scan-frame-hint">将食物对准框内</span>
              </div>
            )}

            {/* 工具栏 */}
            {cameraReady && (
              <div className="scan-toolbar">
                <button className="scan-tool-btn" onClick={flipCamera} title="翻转摄像头">
                  🔄
                </button>
                {facingMode === 'environment' && (
                  <button
                    className={`scan-tool-btn ${torchOn ? 'active' : ''}`}
                    onClick={toggleTorch}
                    title="手电筒"
                  >
                    {torchOn ? '🔦' : '💡'}
                  </button>
                )}
              </div>
            )}

            {/* 拍照按钮 */}
            {cameraReady && (
              <button className="scan-capture-btn" onClick={capture}>
                <div className="scan-capture-inner" />
                <div className="scan-capture-ring" />
              </button>
            )}
          </div>
        ) : (
          <div className="scan-preview">
            <img src={captured} alt="captured" className="scan-preview-img" />
            {!results && !scanning && (
              <div className="scan-preview-actions">
                <button className="btn btn-outline" onClick={retake}>
                  📷 重拍
                </button>
                <button className="btn btn-primary" onClick={scan} disabled={scanning}>
                  🔍 AI 识别食物
                </button>
              </div>
            )}
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="scan-error">
            <span className="scan-error-icon">⚠️</span>
            <span className="scan-error-text">{error}</span>
          </div>
        )}

        {/* 扫描中 — 分步骤动画 */}
        {scanning && (
          <div className="scan-loading">
            <div className="scan-spinner" />
            <div className="scan-loading-steps">
              {scanSteps.map((step, i) => (
                <div key={i} className={`scan-step ${i < scanStep ? 'done' : i === scanStep ? 'active' : ''}`}>
                  <span className="scan-step-dot">
                    {i < scanStep ? '✅' : i === scanStep ? '⏳' : '○'}
                  </span>
                  <span className="scan-step-text">{step}</span>
                </div>
              ))}
            </div>
            {retryCount > 0 && (
              <p className="scan-retry-hint">第 {retryCount + 1} 次尝试...</p>
            )}
          </div>
        )}

        {/* 识别结果 */}
        {results && results.length > 0 && (
          <div className="scan-results">
            <div className="scan-results-header">
              <span>🎯 识别到 {results.length} 种食物</span>
              <div className="scan-results-header-actions">
                <button className="scan-select-all-btn" onClick={selectAll}>全选</button>
              </div>
            </div>

            {hasConfidence && (
              <p className="scan-confidence-hint">置信度仅供参考，请核对后再添加</p>
            )}

            {results.map((food, i) => {
              const conf = getConfidenceLevel(food.confidence)
              const portions = resultPortions[i] || 1
              const adjustedKcal = Math.round(food.kcal * portions)
              const isEditing = editingIndex === i

              return (
                <div key={i}>
                  <div
                    className={`scan-food-card ${selected[i] ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
                    onClick={() => { if (!isEditing) toggleFood(i) }}
                  >
                    <div className="scan-food-check" onClick={(e) => { e.stopPropagation(); toggleFood(i) }}>
                      {selected[i] ? '✅' : '○'}
                    </div>
                    <div className="scan-food-info">
                      {isEditing ? (
                        <div className="scan-edit-fields" onClick={e => e.stopPropagation()}>
                          <input
                            className="scan-edit-input scan-edit-name"
                            value={food.name}
                            onChange={e => updateFoodField(i, 'name', e.target.value)}
                            placeholder="食物名称"
                          />
                          <div className="scan-edit-row">
                            <input
                              className="scan-edit-input"
                              type="number"
                              value={food.kcal}
                              onChange={e => updateFoodField(i, 'kcal', Number(e.target.value))}
                              placeholder="热量"
                            />
                            <span className="scan-edit-unit">kcal/份</span>
                            <input
                              className="scan-edit-input"
                              value={food.portion}
                              onChange={e => updateFoodField(i, 'portion', e.target.value)}
                              placeholder="份量"
                            />
                          </div>
                          {/* 份数调节 */}
                          <div className="scan-portion-row" onClick={e => e.stopPropagation()}>
                            <span className="scan-portion-label">份数</span>
                            <button className="scan-portion-btn" onClick={() => adjustPortion(i, -0.5)}>−</button>
                            <span className="scan-portion-value">{portions}</span>
                            <button className="scan-portion-btn" onClick={() => adjustPortion(i, 0.5)}>+</button>
                            {portions !== 1 && (
                              <span className="scan-portion-total">= {Math.round(food.kcal * portions)} kcal</span>
                            )}
                            <button className="scan-edit-done-btn" onClick={finishEditing}>完成 ✓</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="scan-food-name">
                            {food.name}
                            {portions !== 1 && <span className="scan-food-portions"> ×{portions}</span>}
                            {food.emoji && <span className="scan-food-emoji"> {food.emoji}</span>}
                          </div>
                          <div className="scan-food-detail">
                            {food.portion || '1份'} · 蛋白质:{Math.round(food.protein * portions)}g 脂肪:{Math.round(food.fat * portions)}g 碳水:{Math.round(food.carbs * portions)}g
                          </div>
                        </>
                      )}
                    </div>
                    <div className="scan-food-right">
                      {!isEditing && (
                        <>
                          <div className="scan-food-kcal">{adjustedKcal} kcal</div>
                          {conf && (
                            <span className={`scan-confidence scan-conf-${conf.cls}`}>
                              {conf.label}置信
                            </span>
                          )}
                        </>
                      )}
                      <button
                        className="scan-edit-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingIndex(isEditing ? null : i)
                        }}
                        title={isEditing ? '收起编辑' : '编辑'}
                      >
                        {isEditing ? '✕' : '✏️'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            <button
              className="btn btn-primary btn-block mt-12"
              disabled={Object.keys(selected).length === 0}
              onClick={addSelected}
            >
              ✅ 添加选中食物 ({Object.keys(selected).length}项)
            </button>
            <button className="btn btn-outline btn-block mt-8" onClick={retake}>
              📷 重新拍照
            </button>
          </div>
        )}

        {/* 未识别到 */}
        {results && results.length === 0 && (
          <div className="scan-results">
            <div className="scan-empty">
              <span className="scan-empty-icon">🔍</span>
              <p className="scan-empty-title">未识别到食物</p>
              <p className="scan-empty-desc">
                请尝试以下方法获得更好的识别效果：<br />
                ① 确保食物在画面中央、清晰可见<br />
                ② 使用纯色背景，避免杂乱<br />
                ③ 保证光线充足，无强烈阴影<br />
                ④ 一次只拍摄一道菜
              </p>
            </div>
            <button className="btn btn-outline btn-block mt-8" onClick={retake}>📷 重新拍照</button>
          </div>
        )}
      </div>
    </div>
  )
}
