/**
 * 中国常见食物数据库
 * 营养数据来源：中国食物成分表 + USDA
 * 每份热量/蛋白质/脂肪/碳水 (per serving)
 */

const FOODS = [
  // ═══════ 主食 (Staples) ═══════
  { id:'rice',      name:'白米饭',     cat:'主食', unit:'碗(150g)',  kcal:174, p:3.9,  f:0.4,  c:38.9 },
  { id:'brown_rice',name:'糙米饭',     cat:'主食', unit:'碗(150g)',  kcal:166, p:3.9,  f:1.4,  c:34.5 },
  { id:'congee',    name:'白粥',       cat:'主食', unit:'碗(250g)',  kcal:115, p:2.8,  f:0.3,  c:25.0 },
  { id:'noodle',    name:'煮面条',     cat:'主食', unit:'碗(200g)',  kcal:220, p:8.0,  f:0.8,  c:44.0 },
  { id:'bread',     name:'馒头',       cat:'主食', unit:'个(100g)',  kcal:223, p:7.0,  f:1.1,  c:44.2 },
  { id:'baozi',     name:'肉包子',     cat:'主食', unit:'个(80g)',   kcal:180, p:6.5,  f:5.0,  c:26.0 },
  { id:'jiaozi',    name:'水饺',       cat:'主食', unit:'10个(200g)',kcal:420, p:16.0, f:14.0, c:50.0 },
  { id:'wonton',    name:'馄饨',       cat:'主食', unit:'碗(200g)',  kcal:350, p:13.0, f:11.0, c:48.0 },
  { id:'sweet_potato',name:'蒸红薯',   cat:'主食', unit:'个(200g)',  kcal:172, p:2.6,  f:0.4,  c:40.0 },
  { id:'corn',      name:'煮玉米',     cat:'主食', unit:'根(200g)',  kcal:192, p:6.0,  f:2.2,  c:38.0 },
  { id:'oats',      name:'燕麦片',     cat:'主食', unit:'碗(50g)',   kcal:188, p:6.7,  f:3.3,  c:33.0 },
  { id:'whole_wheat_bread',name:'全麦面包',cat:'主食',unit:'片(40g)',kcal:98,  p:4.0,  f:1.2,  c:18.0 },
  { id:'mantou_whole',name:'全麦馒头', cat:'主食', unit:'个(100g)',  kcal:210, p:8.0,  f:1.5,  c:42.0 },

  // ═══════ 肉类 (Meat) ═══════
  { id:'chicken_breast',name:'鸡胸肉', cat:'肉类', unit:'块(150g)',  kcal:200, p:46.5, f:3.0,  c:0 },
  { id:'chicken_leg', name:'鸡腿(去皮)',cat:'肉类',unit:'个(100g)',  kcal:150, p:20.0, f:8.0,  c:0 },
  { id:'beef_lean',  name:'瘦牛肉',     cat:'肉类', unit:'份(150g)',  kcal:225, p:39.0, f:7.5,  c:0 },
  { id:'pork_lean',  name:'瘦猪肉',     cat:'肉类', unit:'份(150g)',  kcal:215, p:30.0, f:9.0,  c:0 },
  { id:'pork_belly', name:'五花肉',     cat:'肉类', unit:'份(100g)',  kcal:395, p:13.0, f:37.0, c:0 },
  { id:'fish_steamed',name:'清蒸鱼',    cat:'肉类', unit:'条(200g)',  kcal:210, p:38.0, f:5.0,  c:0 },
  { id:'salmon',     name:'三文鱼',     cat:'肉类', unit:'份(100g)',  kcal:208, p:20.0, f:13.0, c:0 },
  { id:'shrimp',     name:'虾仁',       cat:'肉类', unit:'份(150g)',  kcal:148, p:30.0, f:2.0,  c:1.5 },
  { id:'duck_breast',name:'鸭胸肉',     cat:'肉类', unit:'份(150g)',  kcal:210, p:27.0, f:10.0, c:0 },
  { id:'lamb',       name:'羊肉片',     cat:'肉类', unit:'份(150g)',  kcal:294, p:28.5, f:19.5, c:0 },

  // ═══════ 蛋奶豆 (Eggs, Dairy, Soy) ═══════
  { id:'egg_boiled', name:'水煮蛋',     cat:'蛋奶豆', unit:'个(50g)',  kcal:72,  p:6.2,  f:5.0,  c:0.5 },
  { id:'egg_fried',  name:'煎蛋',       cat:'蛋奶豆', unit:'个(55g)',  kcal:110, p:6.5,  f:9.0,  c:0.5 },
  { id:'milk',       name:'全脂牛奶',   cat:'蛋奶豆', unit:'杯(250ml)',kcal:155, p:8.0,  f:8.0,  c:12.0 },
  { id:'milk_skim',  name:'脱脂牛奶',   cat:'蛋奶豆', unit:'杯(250ml)',kcal:88,  p:9.0,  f:0.5,  c:12.0 },
  { id:'yogurt_plain',name:'无糖酸奶',  cat:'蛋奶豆', unit:'杯(200g)',  kcal:114, p:7.0,  f:6.0,  c:8.0 },
  { id:'yogurt_greek',name:'希腊酸奶',  cat:'蛋奶豆', unit:'杯(150g)',  kcal:145, p:15.0, f:8.0,  c:5.0 },
  { id:'soy_milk',  name:'豆浆(无糖)',  cat:'蛋奶豆', unit:'杯(250ml)',kcal:80,  p:7.0,  f:3.5,  c:5.0 },
  { id:'tofu',      name:'豆腐',        cat:'蛋奶豆', unit:'块(200g)',  kcal:152, p:16.0, f:8.0,  c:4.0 },
  { id:'cheese_slice',name:'芝士片',    cat:'蛋奶豆', unit:'片(20g)',   kcal:65,  p:4.0,  f:5.0,  c:0.5 },
  { id:'protein_shake',name:'蛋白粉(乳清)',cat:'蛋奶豆',unit:'勺(30g)',kcal:120, p:24.0, f:1.5,  c:3.0 },

  // ═══════ 蔬菜 (Vegetables) ═══════
  { id:'broccoli',  name:'西兰花',      cat:'蔬菜', unit:'份(200g)',  kcal:68,  p:5.6,  f:0.8,  c:12.0 },
  { id:'spinach',   name:'菠菜',        cat:'蔬菜', unit:'份(200g)',  kcal:46,  p:5.8,  f:0.4,  c:7.6 },
  { id:'tomato',    name:'番茄',        cat:'蔬菜', unit:'个(150g)',  kcal:27,  p:1.4,  f:0.3,  c:5.0 },
  { id:'cucumber',  name:'黄瓜',        cat:'蔬菜', unit:'根(200g)',  kcal:30,  p:1.4,  f:0.2,  c:5.8 },
  { id:'lettuce',   name:'生菜',        cat:'蔬菜', unit:'份(200g)',  kcal:30,  p:2.6,  f:0.4,  c:4.6 },
  { id:'cabbage',   name:'大白菜',      cat:'蔬菜', unit:'份(200g)',  kcal:26,  p:3.0,  f:0.2,  c:4.4 },
  { id:'carrot',    name:'胡萝卜',      cat:'蔬菜', unit:'根(150g)',  kcal:62,  p:1.4,  f:0.3,  c:14.0 },
  { id:'mushroom',  name:'香菇',        cat:'蔬菜', unit:'份(150g)',  kcal:39,  p:3.6,  f:0.6,  c:6.0 },
  { id:'celery',    name:'芹菜',        cat:'蔬菜', unit:'份(200g)',  kcal:28,  p:1.4,  f:0.2,  c:5.4 },
  { id:'bell_pepper',name:'彩椒',       cat:'蔬菜', unit:'个(150g)',  kcal:30,  p:1.5,  f:0.3,  c:5.6 },
  { id:'asparagus', name:'芦笋',        cat:'蔬菜', unit:'份(150g)',  kcal:30,  p:3.6,  f:0.3,  c:4.5 },
  { id:'kelp',      name:'海带',        cat:'蔬菜', unit:'份(100g)',  kcal:14,  p:1.2,  f:0.1,  c:2.0 },

  // ═══════ 水果 (Fruits) ═══════
  { id:'apple',     name:'苹果',        cat:'水果', unit:'个(200g)',  kcal:104, p:0.6,  f:0.2,  c:27.0 },
  { id:'banana',    name:'香蕉',        cat:'水果', unit:'根(120g)',  kcal:105, p:1.3,  f:0.4,  c:27.0 },
  { id:'orange',    name:'橙子',        cat:'水果', unit:'个(200g)',  kcal:94,  p:1.8,  f:0.2,  c:23.0 },
  { id:'grape',     name:'葡萄',        cat:'水果', unit:'串(200g)',  kcal:138, p:1.0,  f:0.4,  c:35.0 },
  { id:'watermelon',name:'西瓜',        cat:'水果', unit:'片(300g)',  kcal:90,  p:1.8,  f:0.3,  c:21.0 },
  { id:'kiwi',      name:'猕猴桃',      cat:'水果', unit:'个(80g)',   kcal:50,  p:0.9,  f:0.3,  c:10.8 },
  { id:'blueberry', name:'蓝莓',        cat:'水果', unit:'盒(125g)',  kcal:71,  p:0.9,  f:0.4,  c:18.0 },
  { id:'strawberry',name:'草莓',        cat:'水果', unit:'盒(200g)',  kcal:64,  p:1.2,  f:0.6,  c:13.0 },
  { id:'avocado',   name:'牛油果',      cat:'水果', unit:'个(100g)',  kcal:160, p:2.0,  f:15.0, c:2.0 },
  { id:'pear',      name:'梨',          cat:'水果', unit:'个(200g)',  kcal:100, p:0.8,  f:0.2,  c:25.0 },

  // ═══════ 零食饮料 (Snacks & Drinks) ═══════
  { id:'latte',     name:'拿铁咖啡',    cat:'零食饮料', unit:'杯(350ml)',kcal:190, p:8.0, f:7.0, c:18.0 },
  { id:'americano', name:'美式咖啡(黑)',cat:'零食饮料', unit:'杯(350ml)',kcal:10,  p:0.5, f:0,   c:1.5 },
  { id:'bubble_tea',name:'珍珠奶茶',    cat:'零食饮料', unit:'杯(500ml)',kcal:350, p:3.0, f:6.0, c:70.0 },
  { id:'coke',      name:'可口可乐',    cat:'零食饮料', unit:'罐(330ml)',kcal:139, p:0,   f:0,   c:35.0 },
  { id:'coke_zero', name:'零度可乐',    cat:'零食饮料', unit:'罐(330ml)',kcal:1,   p:0,   f:0,   c:0 },
  { id:'beer',      name:'啤酒',        cat:'零食饮料', unit:'瓶(500ml)',kcal:215, p:2.5, f:0,   c:17.5 },
  { id:'chips',     name:'薯片',        cat:'零食饮料', unit:'袋(75g)',   kcal:400, p:4.0, f:25.0,c:45.0 },
  { id:'chocolate', name:'黑巧克力',    cat:'零食饮料', unit:'块(30g)',   kcal:160, p:2.0, f:10.0,c:14.0 },
  { id:'nuts_mix',  name:'混合坚果',    cat:'零食饮料', unit:'把(30g)',   kcal:175, p:5.0, f:16.0,c:5.0 },
  { id:'ice_cream', name:'冰淇淋',      cat:'零食饮料', unit:'球(100g)',  kcal:207, p:3.5, f:11.0,c:23.0 },

  // ═══════ 外卖/快餐 (Takeout/Fast Food) ═══════
  { id:'fried_rice',  name:'蛋炒饭',    cat:'外卖快餐', unit:'份(300g)',kcal:450, p:10.0, f:12.0,c:75.0 },
  { id:'fried_noodle',name:'炒面',      cat:'外卖快餐', unit:'份(300g)',kcal:480, p:12.0, f:14.0,c:68.0 },
  { id:'kung_pao',   name:'宫保鸡丁',   cat:'外卖快餐', unit:'份(200g)',kcal:320, p:22.0, f:18.0,c:14.0 },
  { id:'mapo_tofu',  name:'麻婆豆腐',   cat:'外卖快餐', unit:'份(200g)',kcal:240, p:12.0, f:16.0,c:10.0 },
  { id:'twice_pork', name:'回锅肉',     cat:'外卖快餐', unit:'份(200g)',kcal:380, p:16.0, f:30.0,c:8.0 },
  { id:'tomato_egg', name:'番茄炒蛋',   cat:'外卖快餐', unit:'份(200g)',kcal:180, p:10.0, f:8.0, c:16.0 },
  { id:'braised_eggplant',name:'红烧茄子',cat:'外卖快餐',unit:'份(200g)',kcal:220, p:2.0, f:16.0,c:18.0 },
  { id:'hotpot_beef',name:'火锅(肥牛)', cat:'外卖快餐', unit:'份(200g)',kcal:500, p:28.0, f:40.0,c:8.0 },
  { id:'burger',     name:'汉堡',       cat:'外卖快餐', unit:'个(200g)',kcal:500, p:25.0, f:22.0,c:45.0 },
  { id:'fried_chicken',name:'炸鸡腿',   cat:'外卖快餐', unit:'个(150g)',kcal:375, p:28.0, f:22.0,c:12.0 },
  { id:'pizza_slice',name:'披萨(一片)', cat:'外卖快餐', unit:'片(150g)',kcal:320, p:13.0, f:12.0,c:38.0 },
  { id:'malatang',  name:'麻辣烫(清汤)',cat:'外卖快餐', unit:'碗(400g)',kcal:350, p:20.0, f:18.0,c:25.0 },
  { id:'jianbing',  name:'煎饼果子',    cat:'外卖快餐', unit:'个(200g)',kcal:350, p:10.0, f:12.0,c:48.0 },
  { id:'sushi_roll',name:'寿司卷',      cat:'外卖快餐', unit:'6个(180g)',kcal:280, p:10.0, f:3.0, c:48.0 },
  { id:'bibimbap',  name:'韩式拌饭',    cat:'外卖快餐', unit:'碗(400g)',kcal:520, p:18.0, f:15.0,c:75.0 },

  // ═══════ 调味酱料 (Condiments) ═══════
  { id:'oil_olive',  name:'橄榄油',     cat:'调味酱料', unit:'勺(10ml)',kcal:88, p:0,  f:10.0, c:0 },
  { id:'oil_veg',    name:'植物油',     cat:'调味酱料', unit:'勺(10ml)',kcal:88, p:0,  f:10.0, c:0 },
  { id:'mayo',       name:'蛋黄酱',     cat:'调味酱料', unit:'勺(15g)', kcal:100, p:0.2,f:11.0,c:0.5 },
  { id:'peanut_butter',name:'花生酱',   cat:'调味酱料', unit:'勺(20g)', kcal:120, p:4.5,f:10.0,c:3.5 },
  { id:'soy_sauce',  name:'酱油',       cat:'调味酱料', unit:'勺(10ml)',kcal:6,  p:0.8,f:0,  c:0.6 },
  { id:'sugar',      name:'白砂糖',     cat:'调味酱料', unit:'勺(5g)',  kcal:20, p:0,  f:0,   c:5.0 },
  { id:'sesame_paste',name:'芝麻酱',    cat:'调味酱料', unit:'勺(20g)', kcal:118, p:4.0,f:9.5, c:3.0 },
]

export default FOODS
export const FOOD_CATEGORIES = ['全部', '主食', '肉类', '蛋奶豆', '蔬菜', '水果', '零食饮料', '外卖快餐', '调味酱料']
