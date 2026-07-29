/**
 * 减脂餐食模板库
 * 按热量档位分组的中国家庭实用餐食搭配
 * 每份模板包含：菜名、食材组合、热量、三大营养素、烹饪方式
 */

const MEAL_TEMPLATES = [
  // ═══════════════ 300-400 kcal 档（轻食/加餐）═══════════════
  {
    id:'m1', name:'鸡胸肉蔬菜沙拉', type:'light', kcal:320, p:38, f:8, c:22,
    foods: ['鸡胸肉(150g)', '生菜', '番茄', '黄瓜', '橄榄油(5ml)'],
    method: '鸡胸肉水煮切片，蔬菜洗净切块，淋少量橄榄油和黑胡椒',
    suitable: '午餐/晚餐 · 高蛋白低脂',
    tags: ['高蛋白','低脂'],
  },
  {
    id:'m2', name:'希腊酸奶水果碗', type:'light', kcal:280, p:18, f:9, c:32,
    foods: ['希腊酸奶(150g)', '蓝莓(50g)', '香蕉(半根)', '混合坚果(15g)'],
    method: '酸奶打底，铺上水果和坚果即可',
    suitable: '早餐/加餐 · 快捷营养',
    tags: ['快手','高蛋白'],
  },
  {
    id:'m3', name:'水煮蛋 + 全麦吐司', type:'light', kcal:290, p:17, f:12, c:28,
    foods: ['水煮蛋×2', '全麦面包×2', '脱脂牛奶(200ml)'],
    method: '鸡蛋水煮7分钟，全麦面包烤至微脆',
    suitable: '早餐 · 简单高效',
    tags: ['快手','高蛋白'],
  },
  {
    id:'m4', name:'虾仁豆腐汤', type:'light', kcal:310, p:32, f:6, c:28,
    foods: ['虾仁(150g)', '豆腐(150g)', '大白菜', '姜片'],
    method: '清水烧开，虾仁豆腐入锅煮5分钟，加白菜烫熟，少许盐调味',
    suitable: '晚餐 · 低脂高蛋白',
    tags: ['低脂','高蛋白','汤类'],
  },

  // ═══════════════ 400-500 kcal 档（正餐）═══════════════
  {
    id:'m5', name:'鸡胸肉 + 西兰花 + 糙米饭', type:'meal', kcal:470, p:44, f:7, c:55,
    foods: ['鸡胸肉(150g)', '西兰花(200g)', '糙米饭(150g)'],
    method: '鸡胸肉少油煎至两面金黄，西兰花清炒或水煮，糙米饭电饭煲正常煮',
    suitable: '午餐 · 健身标配',
    tags: ['高蛋白','健身餐'],
  },
  {
    id:'m6', name:'清蒸鱼 + 蒜蓉菠菜 + 杂粮饭', type:'meal', kcal:430, p:35, f:8, c:50,
    foods: ['清蒸鱼(150g)', '菠菜(200g)', '杂粮饭(120g)'],
    method: '鱼清蒸8-10分钟淋蒸鱼豉油，菠菜焯水拌蒜蓉，杂粮饭正常煮',
    suitable: '午餐/晚餐 · 营养均衡',
    tags: ['均衡','清蒸'],
  },
  {
    id:'m7', name:'牛肉蔬菜炒面（控油版）', type:'meal', kcal:480, p:28, f:12, c:58,
    foods: ['瘦牛肉(120g)', '煮面条(150g)', '彩椒+胡萝卜', '少量油'],
    method: '牛肉切丝腌制，少油快炒，加蔬菜和煮好的面条翻炒均匀',
    suitable: '午餐 · 满足感强',
    tags: ['满足感','家常'],
  },
  {
    id:'m8', name:'番茄炒蛋 + 糙米饭', type:'meal', kcal:420, p:18, f:12, c:58,
    foods: ['鸡蛋×2', '番茄×2', '糙米饭(150g)', '少量油'],
    method: '鸡蛋炒散备用，番茄炒出汁后混合，少油少糖',
    suitable: '午餐/晚餐 · 简单家常',
    tags: ['快手','家常'],
  },
  {
    id:'m9', name:'三文鱼 + 芦笋 + 蒸红薯', type:'meal', kcal:460, p:28, f:14, c:52,
    foods: ['三文鱼(120g)', '芦笋(150g)', '蒸红薯(200g)'],
    method: '三文鱼少油煎3分钟每面，芦笋焯水，红薯蒸熟',
    suitable: '午餐 · 优质脂肪',
    tags: ['优质脂肪','omega3'],
  },

  // ═══════════════ 500-600 kcal 档（较大餐）═══════════════
  {
    id:'m10', name:'鸡腿肉蔬菜锅', type:'meal', kcal:520, p:36, f:16, c:52,
    foods: ['鸡腿肉去皮(150g)', '香菇+豆腐+大白菜', '米饭(150g)'],
    method: '鸡腿肉切块少油煸炒，加蔬菜和少量水焖煮10分钟，配米饭',
    suitable: '晚餐 · 暖胃饱腹',
    tags: ['饱腹','暖食'],
  },
  {
    id:'m11', name:'牛肉西兰花盖饭', type:'meal', kcal:540, p:34, f:14, c:62,
    foods: ['瘦牛肉(120g)', '西兰花(200g)', '米饭(180g)', '蚝油少量'],
    method: '牛肉切片腌制，少油爆炒加西兰花翻炒，蚝油调味，盖在饭上',
    suitable: '午餐 · 满足感强',
    tags: ['满足感','家常'],
  },
  {
    id:'m12', name:'麻辣烫（自制清汤版）', type:'meal', kcal:500, p:30, f:14, c:58,
    foods: ['虾仁+鸡胸肉(共180g)', '豆腐+海带+木耳+青菜', '粉丝(50g)'],
    method: '清水+少许火锅底料(5g)煮开，食材依次下锅烫熟，蘸醋食用',
    suitable: '晚餐 · 解馋不胖',
    tags: ['解馋','低负担'],
  },

  // ═══════════════ 减脂外食/替代 ════════════════
  {
    id:'m13', name:'自制减脂版黄焖鸡', type:'meal', kcal:450, p:35, f:11, c:48,
    foods: ['去皮鸡腿肉(200g)', '香菇+青椒', '米饭(130g)', '生抽+姜'],
    method: '鸡腿肉煸炒至变色，加香菇生抽焖15分钟，最后放青椒收汁',
    suitable: '午餐 · 外卖平替',
    tags: ['外卖平替','高蛋白'],
  },
  {
    id:'m14', name:'凉拌鸡丝荞麦面', type:'meal', kcal:400, p:32, f:8, c:48,
    foods: ['鸡胸肉(150g)', '荞麦面(80g干)', '黄瓜丝+胡萝卜丝', '醋+生抽'],
    method: '鸡胸肉水煮撕丝，荞麦面煮熟过凉水，加蔬菜丝和调料拌匀',
    suitable: '夏季午餐 · 清爽低脂',
    tags: ['清爽','高蛋白','夏季'],
  },

  // ═══════════════ 500-600 kcal 扩展 ════════════
  {
    id:'m15', name:'三文鱼牛油果波奇碗', type:'meal', kcal:520, p:30, f:22, c:48,
    foods: ['三文鱼(100g)', '牛油果(半颗)', '糙米饭(150g)', '海苔+毛豆+酱油'],
    method: '三文鱼切丁酱油腌制，牛油果切片，所有食材铺在饭上即可',
    suitable: '午餐 · 高蛋白优质脂肪',
    tags: ['优质脂肪','omega3','快手'],
  },
  {
    id:'m16', name:'番茄牛腩汤 + 杂粮饭', type:'meal', kcal:530, p:32, f:14, c:60,
    foods: ['瘦牛肉(120g)', '番茄×3', '土豆(100g)', '杂粮饭(120g)'],
    method: '牛肉焯水后与番茄炖1小时，土豆后放保持口感，配杂粮饭',
    suitable: '晚餐 · 暖胃高蛋白',
    tags: ['暖食','高蛋白','汤类'],
  },
  {
    id:'m17', name:'金枪鱼沙拉三明治', type:'meal', kcal:430, p:32, f:10, c:50,
    foods: ['金枪鱼罐头(100g)', '全麦面包×2', '生菜+番茄+洋葱', '少量蛋黄酱'],
    method: '金枪鱼沥干拌少量蛋黄酱，蔬菜切丝夹入全麦面包',
    suitable: '午餐 · 快手便携',
    tags: ['快手','高蛋白','便当'],
  },

  // ═══════════════ 500-600 kcal 档（较大餐）扩展 ════════════════
  {
    id:'m18', name:'酸菜鱼 + 米饭', type:'meal', kcal:550, p:34, f:18, c:58,
    foods: ['鱼片(150g)', '酸菜(100g)', '豆芽+金针菇', '米饭(150g)'],
    method: '酸菜炒香加水煮开，鱼片滑入汤中烫熟，配米饭',
    suitable: '午餐/晚餐 · 满足感强',
    tags: ['满足感','家常','高蛋白'],
  },
  {
    id:'m19', name:'藜麦鸡胸能量碗', type:'meal', kcal:480, p:42, f:10, c:50,
    foods: ['鸡胸肉(150g)', '藜麦(80g生)', '西兰花+彩椒+玉米粒', '橄榄油(5ml)'],
    method: '藜麦煮熟沥干，鸡胸肉少油煎熟切片，蔬菜焯水摆盘',
    suitable: '午餐 · 超级食物组合',
    tags: ['超级食物','高蛋白','健身餐'],
  },

  // ═══════════════ 减脂汤品类 ════════════════
  {
    id:'m20', name:'冬瓜排骨汤 (去油版)', type:'light', kcal:280, p:18, f:8, c:28,
    foods: ['猪排骨(100g)', '冬瓜(250g)', '姜片', '枸杞少量'],
    method: '排骨焯水去浮沫，与冬瓜姜片同煮40分钟，撇去浮油后食用',
    suitable: '晚餐 · 清热利尿',
    tags: ['汤类','低脂','暖食'],
  },
  {
    id:'m21', name:'番茄蛋花汤 + 凉拌菜', type:'light', kcal:180, p:10, f:6, c:20,
    foods: ['鸡蛋×1', '番茄×1', '黄瓜+木耳(凉拌)', '少量香油'],
    method: '番茄炒出汁加水煮开淋蛋花，黄瓜木耳焯水凉拌',
    suitable: '晚餐 · 轻食主义',
    tags: ['轻食','快手','汤类'],
  },

  // ═══════════════ 减脂甜品/加餐 ════════════════
  {
    id:'m22', name:'隔夜燕麦杯', type:'light', kcal:310, p:16, f:8, c:45,
    foods: ['燕麦片(50g)', '脱脂牛奶(200ml)', '希腊酸奶(50g)', '蓝莓+香蕉片'],
    method: '燕麦+牛奶+酸奶混合冷藏过夜，早上取出加水果即可',
    suitable: '早餐 · 提前准备',
    tags: ['快手','高纤维','早餐'],
  },
  {
    id:'m23', name:'蒸红薯 + 水煮蛋 + 豆浆', type:'light', kcal:320, p:16, f:6, c:52,
    foods: ['蒸红薯(200g)', '水煮蛋×1', '无糖豆浆(250ml)'],
    method: '红薯蒸20分钟至软糯，鸡蛋水煮7分钟，豆浆加热',
    suitable: '早餐 · 中式经典',
    tags: ['快手','中式','早餐'],
  },

  // ═══════════════ 外食替代扩展 ════════════════
  {
    id:'m24', name:'自制低脂版麻辣香锅', type:'meal', kcal:480, p:35, f:14, c:45,
    foods: ['鸡胸肉(120g)', '虾仁(100g)', '西兰花+藕片+木耳', '少量麻辣底料(10g)', '米饭(130g)'],
    method: '底料少油炒香，食材依次下锅翻炒，控制油量在10g以内',
    suitable: '午餐 · 解馋不胖',
    tags: ['解馋','高蛋白','外卖平替'],
  },
  {
    id:'m25', name:'低卡版卤肉饭', type:'meal', kcal:490, p:28, f:14, c:58,
    foods: ['瘦猪肉末(80g)', '香菇+洋葱', '水煮蛋×1', '糙米饭(150g)'],
    method: '少油炒香洋葱香菇，加肉末和少许酱油炖煮，配糙米饭和半个卤蛋',
    suitable: '午餐 · 台湾风味轻版',
    tags: ['外卖平替','满足感','家常'],
  },
  {
    id:'m26', name:'日式亲子丼 (低卡版)', type:'meal', kcal:440, p:30, f:10, c:54,
    foods: ['去皮鸡腿肉(120g)', '鸡蛋×1', '洋葱', '米饭(150g)', '日式酱油'],
    method: '鸡肉洋葱酱油煮8分钟，淋入蛋液焖1分钟，盖在饭上',
    suitable: '午餐 · 日式家庭料理',
    tags: ['快手','家常','日式'],
  },
]

export default MEAL_TEMPLATES

/**
 * 根据剩余热量和宏量营养素缺口，推荐最合适的餐食
 */
export function recommendMeals(remainingKcal, macroGaps, mealType = 'any') {
  // macroGaps: { protein: 需要补充的量(克), fat, carbs }
  const scored = MEAL_TEMPLATES.map(m => {
    let score = 0

    // 热量匹配度（30分）
    const kcalDiff = Math.abs(m.kcal - remainingKcal)
    if (kcalDiff < 50) score += 30
    else if (kcalDiff < 100) score += 20
    else if (kcalDiff < 200) score += 10
    else score += 5

    // 蛋白质匹配度（35分）— 蛋白质是减脂期最重要指标
    const proteinGap = macroGaps.protein || 0
    if (proteinGap > 0) {
      const proteinMatch = Math.min(1, m.p / Math.max(1, proteinGap))
      score += Math.round(proteinMatch * 35)
    } else {
      score += 15 // no protein gap needed, any is fine
    }

    // 脂肪控制（20分）— 减脂期不宜过高脂肪
    if (macroGaps.fat > 0 && m.f <= macroGaps.fat * 1.1) score += 20
    else if (m.f < 15) score += 15
    else score += 5

    // 碳水量匹配（10分）
    if (macroGaps.carbs > 0) {
      const carbMatch = Math.min(1, m.c / Math.max(1, macroGaps.carbs))
      score += Math.round(carbMatch * 10)
    } else {
      score += 5
    }

    // 多样性加分（5分）
    if (m.tags.includes('高蛋白')) score += 5

    return { ...m, score }
  })

  return scored.sort((a, b) => b.score - a.score).slice(0, 4)
}
