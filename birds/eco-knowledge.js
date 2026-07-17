/*
 * eco-knowledge.js — 「羽迹·深湾」互动增强层共享知识库与工具
 * 数据基于 HZ-CZY/Hongshuling 仓库中已文档化的物种(物种图鉴 / 物种卡),
 * 并补充了问答、AI 问答对、迁徙路线等互动所需内容。
 * 仅依赖浏览器 localStorage,无任何外部请求。
 */
(function (global) {
  'use strict';

  // ---- 物种知识库(与仓库现有物种保持一致) ----
  // category: bird(候鸟) / plant(红树林植物) / intertidal(潮间带生物)
  const SPECIES = [
    {
      id: 'black-faced-spoonbill', name: '黑脸琵鹭', enName: 'Black-faced Spoonbill',
      emoji: '🦩', category: 'bird', color: '#42d4a5', status: '濒危(EN)',
      habitat: '深圳湾滩涂、红树林及河口',
      intro: '黑脸琵鹭是全球濒危物种,嘴呈黑色琵琶状,脸与腿为黑色,越冬种群高度依赖东亚—澳大利西亚迁飞区的少数湿地。深圳湾是其在中国最重要的越冬地之一。',
      facts: ['全球种群仅约 6000 余只,极为珍稀', '觅食时用琵琶状嘴在水中左右扫动滤食', '繁殖羽会变成淡淡的黄色'],
      tip: '保持远距离观察,不进入其觅食与休息的滩涂核心区。',
      arrivesShenzhenBay: '每年 10 月底至次年 4 月越冬,高峰期在 12 月—次年 2 月',
      migrationRoute: '繁殖于朝鲜半岛西部及中国辽东半岛岛屿 → 沿中国东部沿海南下 → 越冬于深圳湾、香港米埔、台湾曾文溪口等地(东亚—澳大利西亚迁飞区)。',
      quiz: [
        { q: '黑脸琵鹭的嘴是什么形状?', options: ['直而尖的锥状', '黑色琵琶状', '向上弯曲的钩状', '宽扁的鸭嘴状'], answer: 1 },
        { q: '它的 IUCN 保护等级是?', options: ['无危(LC)', '近危(NT)', '濒危(EN)', '极危(CR)'], answer: 2 },
        { q: '深圳湾观测它的高峰期大约在?', options: ['6—8 月', '12 月—次年 2 月', '3 月', '9 月'], answer: 1 }
      ],
      ai: [
        { k: ['几月', '什么时候', '来深湾', '季节', '越冬'], a: '黑脸琵鹭每年 10 月底开始抵达深圳湾越冬,12 月至次年 2 月是观测高峰期,次年 4 月前后北返繁殖地。' },
        { k: ['区别', '区分', '识别', '特征'], a: '最易辨认的是它黑色的琵琶状长嘴、黑色脸盘与黑腿;飞行时颈与腿伸直。和白色鹭类相比,它的嘴型独一无二。' },
        { k: ['保护', '濒危', '为什么少', '等级'], a: '黑脸琵鹭被列为濒危(EN),全球种群仅约 6000 余只,高度依赖少数关键湿地,栖息地丧失与人为干扰是主要威胁。' },
        { k: ['迁徙', '路线', '从哪来', '去哪'], a: '它繁殖于朝鲜半岛及辽东半岛岛屿,沿中国东部沿海南下,越冬于深圳湾、香港米埔、台湾曾文溪口等东亚—澳大利西亚迁飞区节点。' }
      ]
    },
    {
      id: 'red-billed-gull', name: '红嘴鸥', enName: 'Black-headed Gull',
      emoji: '🐦', category: 'bird', color: '#4aa8d8', status: '无危(LC)',
      habitat: '深圳湾开阔水面、滩涂与城市滨水',
      intro: '红嘴鸥是人们最熟悉的越冬鸥类之一,冬季成群的银灰身影常见于深圳湾。繁殖期头呈深褐色,非繁殖期头白、嘴与脚红色。',
      facts: ['非繁殖期嘴和脚为鲜红色', '常成群在滩涂与水面觅食', '游泳与飞翔都很灵活'],
      tip: '投喂人类食物会打乱其自然食性,请勿随意投喂。',
      arrivesShenzhenBay: '每年 11 月至次年 3 月',
      migrationRoute: '繁殖于欧亚北部湖泊与苔原 → 冬季南迁至中国南方沿海、内陆湖泊及城市水体越冬(包括深圳湾)。',
      quiz: [
        { q: '红嘴鸥非繁殖期最显眼的特征是?', options: ['黑嘴黑脚', '红嘴红脚', '黄嘴', '绿脚'], answer: 1 },
        { q: '它在深圳湾出现的大致时段?', options: ['盛夏', '11 月—次年 3 月', '仅 5 月', '全年均少'], answer: 1 }
      ],
      ai: [
        { k: ['几月', '来深湾', '季节'], a: '红嘴鸥通常 11 月抵达深圳湾,越冬至次年 3 月前后北返。' },
        { k: ['区别', '识别', '特征'], a: '非繁殖期红嘴鸥头白、红嘴红脚、上体银灰,飞行时翼尖有黑斑;与相似鸥类相比体型偏小。' },
        { k: ['保护', '等级'], a: '红嘴鸥为无危(LC),种群数量较大,是城市滨水常见的越冬鸥类。' }
      ]
    },
    {
      id: 'great-egret', name: '大白鹭', enName: 'Great Egret',
      emoji: '🕊️', category: 'bird', color: '#eaf7f2', status: '无危(LC)',
      habitat: '浅水鱼塘、滩涂、红树林水道',
      intro: '大白鹭是体型高大的白色鹭类,喙为黄色(繁殖期变黑),常静立浅水中伺机捕鱼。深圳湾退潮后的浅滩常见其身影。',
      facts: ['繁殖期喙变黑、长出飘逸的婚羽', '常缓慢涉水、定身伏击小鱼虾', '与小白鹭相比明显更大、颈更粗'],
      tip: '观鸟请保持安静,不要惊飞正在觅食的鹭鸟。',
      arrivesShenzhenBay: '留鸟与冬候鸟均有,秋冬更常见',
      migrationRoute: '北方种群夏繁殖于中国东北等地 → 南方种群及越冬个体沿东部迁飞区南下,深圳湾为重要越冬与栖息点。',
      quiz: [
        { q: '大白鹭繁殖期喙的颜色会变成?', options: ['黄色', '黑色', '红色', '蓝色'], answer: 1 },
        { q: '它主要的捕食方式是?', options: ['空中俯冲抓鼠', '静立浅水伏击鱼虾', '潜水捕鱼', '啄食落叶'], answer: 1 }
      ],
      ai: [
        { k: ['几月', '来深湾'], a: '大白鹭在深圳湾全年可见,秋冬越冬种群更多;北方种群夏季北返繁殖。' },
        { k: ['区别', '小白鹭', '识别'], a: '大白鹭明显比小白鹭高大,颈更粗,非繁殖期黄嘴;小白鹭黑嘴、黄脚、体型小。' },
        { k: ['保护', '等级'], a: '大白鹭为无危(LC),在沿海湿地分布较广。' }
      ]
    },
    {
      id: 'grey-heron', name: '苍鹭', enName: 'Grey Heron',
      emoji: '🦅', category: 'bird', color: '#9fb3ad', status: '无危(LC)',
      habitat: '河口、鱼塘、红树林边缘的静水',
      intro: '苍鹭是体型粗壮的灰色鹭类,常长时间静立浅水"守株待兔"式捕鱼,也被称作"老等"。深圳湾及周边鱼塘全年可见。',
      facts: ['可以一动不动站立很久等待猎物', '飞行时颈缩成 S 形、腿向后伸', '成鸟头后有两条黑色饰羽'],
      tip: '靠近鱼塘观鸟时沿田埂慢行,避免惊散鱼群与鹭鸟。',
      arrivesShenzhenBay: '留鸟,全年可见',
      migrationRoute: '部分北方种群季节性迁徙,华南种群多为留鸟;属东亚—澳大利西亚迁飞区常见鹭类。',
      quiz: [
        { q: '苍鹭最有特点的觅食行为是?', options: ['高速盘旋', '长时间静立等待', '潜水', '倒立觅食'], answer: 1 },
        { q: '它飞行时颈部呈?', options: ['伸直', '缩成 S 形', '蜷成一团', '左右摆动'], answer: 1 }
      ],
      ai: [
        { k: ['几月', '来深湾'], a: '苍鹭在深圳湾是留鸟,全年都可见,不严格随季节迁徙。' },
        { k: ['区别', '识别'], a: '苍鹭体型灰、粗壮,头后有两缕黑饰羽;飞行缩颈。与大白鹭相比偏灰、无纯白羽色。' },
        { k: ['保护', '等级'], a: '苍鹭为无危(LC),分布广泛。' }
      ]
    },
    {
      id: 'far-eastern-curlew', name: '白腰杓鹬', enName: 'Far Eastern Curlew / Eurasian Curlew',
      emoji: '🪺', category: 'bird', color: '#caa46a', status: '濒危(EN)',
      habitat: '深圳湾大面积泥滩、潮间带',
      intro: '白腰杓鹬拥有鸻鹬类中极长的下弯喙,是滩涂上的"探针"。它依赖东亚—澳大利西亚迁飞区的泥滩觅食,种群因栖息地丧失而显著下降。',
      facts: ['喙极长且向下弯曲,可探入泥中', '全球种群下降明显,受威胁较大', '常成大群在退潮泥滩觅食'],
      tip: '退潮时给鸻鹬类留足完整觅食滩面,不驾车穿越。',
      arrivesShenzhenBay: '秋冬越冬,约 10 月—次年 4 月',
      migrationRoute: '繁殖于东北亚(如蒙古、中国东北) → 沿东亚—澳大利西亚迁飞区南下 → 越冬于澳洲、中国南方及东南亚泥滩,深圳湾为重要节点。',
      quiz: [
        { q: '白腰杓鹬最醒目的特征是?', options: ['红色短嘴', '极长的下弯喙', '蓝色脚', '无喙'], answer: 1 },
        { q: '它的保护等级是?', options: ['无危', '濒危(EN)', '极危', '灭绝'], answer: 1 }
      ],
      ai: [
        { k: ['几月', '来深湾'], a: '白腰杓鹬约 10 月抵达深圳湾越冬,次年 4 月前后北返,是秋冬滩涂的常见大杓鹬。' },
        { k: ['区别', '识别'], a: '它体大、羽色麻褐、拥有鸻鹬中最长的下弯喙,站立时喙明显长于头颈。' },
        { k: ['保护', '等级'], a: '白腰杓鹬被列为濒危(EN),种群因滩涂围垦而持续下降,是迁飞区重点保护对象。' },
        { k: ['迁徙', '路线'], a: '它繁殖于东北亚,沿东亚—澳大利西亚迁飞区南下,越冬于澳洲与中国南方泥滩,深圳湾是重要补给站。' }
      ]
    },
    {
      id: 'red-necked-stint', name: '红颈滨鹬', enName: 'Red-necked Stint',
      emoji: '🐤', category: 'bird', color: '#d98c6a', status: '无危(LC)',
      habitat: '深圳湾泥滩、潮沟边缘',
      intro: '红颈滨鹬是体型娇小的鹬类,繁殖期颈呈锈红色。它们常在滩面快速啄食,是深圳湾越冬鸻鹬中数量较多的种类之一。',
      facts: ['体型很小,行动敏捷', '繁殖期颈部有锈红色块', '常与其他鸻鹬混群在潮沟边觅食'],
      tip: '使用长焦观察,不要围堵滩面上休息觅食的鹬群。',
      arrivesShenzhenBay: '秋冬越冬,约 9 月—次年 4 月',
      migrationRoute: '繁殖于西伯利亚北极苔原 → 沿东亚—澳大利西亚迁飞区南下 → 越冬于中国南方、东南亚至澳洲沿海滩涂。',
      quiz: [
        { q: '红颈滨鹬的体型特点是?', options: ['很大', '很小且敏捷', '中等如鸭', '像天鹅'], answer: 1 },
        { q: '它属于哪类鸟类?', options: ['鸥类', '鸻鹬类', '鸭类', '猛禽'], answer: 1 }
      ],
      ai: [
        { k: ['几月', '来深湾'], a: '红颈滨鹬约 9 月抵达深圳湾,越冬至次年 4 月前后离开。' },
        { k: ['区别', '识别'], a: '它体型很小、行动快,繁殖期颈带锈红;非繁殖期灰褐,常混在滩面鹬群中。' },
        { k: ['保护', '等级'], a: '红颈滨鹬为无危(LC),但在迁飞区整体依赖泥滩栖息地。' }
      ]
    },
    {
      id: 'little-egret', name: '小白鹭', enName: 'Little Egret',
      emoji: '🪶', category: 'bird', color: '#eaf7f2', status: '无危(LC)',
      habitat: '潮间带、浅水塘、红树林边缘',
      intro: '小白鹭是深圳湾常见的中型白色鹭鸟,黑嘴、黄脚,飞行时颈部缩成 S 形。常在水边用脚搅动惊出猎物。',
      facts: ['黄色脚趾像穿了"黄袜子"', '繁殖期头后长出细长饰羽', '会用脚在水中抖动惊鱼'],
      tip: '观鸟保持安静,不要进入浅滩追赶觅食中的鹭鸟。',
      arrivesShenzhenBay: '全年可见,留鸟与冬候鸟',
      migrationRoute: '属东亚—澳大利西亚迁飞区常见鹭类,部分北方种群季节性南迁,华南多为留鸟。',
      quiz: [
        { q: '小白鹭最易辨认的脚部特征是?', options: ['红脚', '黄脚', '蓝脚', '黑脚'], answer: 1 }
      ],
      ai: [
        { k: ['几月', '来深湾'], a: '小白鹭在深圳湾全年可见,华南种群多为留鸟。' },
        { k: ['区别', '大白鹭'], a: '小白鹭黑嘴、黄脚、体型明显比大白鹭小;大白鹭非繁殖期黄嘴、更大更粗壮。' },
        { k: ['保护', '等级'], a: '小白鹭为无危(LC)。' }
      ]
    },
    {
      id: 'black-winged-stilt', name: '黑翅长脚鹬', enName: 'Black-winged Stilt',
      emoji: '🦩', category: 'bird', color: '#ff746c', status: '无危(LC)',
      habitat: '浅水湿地、鱼塘、盐沼',
      intro: '黑翅长脚鹬拥有极修长的粉红色双腿和黑白分明的羽色,是浅水湿地中非常醒目的涉禽。',
      facts: ['双腿比例在鸟类中极突出', '受惊会发出尖锐警戒声', '常在水浅、视野开阔处成群觅食'],
      tip: '繁殖季勿靠近可能的巢区,遛狗请全程牵绳。',
      arrivesShenzhenBay: '留鸟与夏候鸟,夏季可见繁殖',
      migrationRoute: '属东亚—澳大利西亚迁飞区涉禽,部分种群季节性迁徙,华南湿地常见。',
      quiz: [
        { q: '黑翅长脚鹬最突出的特征是?', options: ['极长粉红腿', '短蓝腿', '无腿', '黄腿'], answer: 0 }
      ],
      ai: [
        { k: ['几月', '来深湾'], a: '黑翅长脚鹬在深圳湾周边湿地全年可见,夏季可见繁殖行为。' },
        { k: ['区别', '识别'], a: '它黑白羽色、双腿极长且呈粉红,辨识度很高。' },
        { k: ['保护', '等级'], a: '黑翅长脚鹬为无危(LC)。' }
      ]
    },
    {
      id: 'pied-avocet', name: '反嘴鹬', enName: 'Pied Avocet',
      emoji: '🐦', category: 'bird', color: '#eaf7f2', status: '无危(LC)',
      habitat: '河口、盐沼、潮间带',
      intro: '反嘴鹬具有黑白羽色和明显向上弯曲的细长嘴,觅食时左右扫动筛取食物。深圳湾是东亚—澳大利西亚迁飞区的重要补给点。',
      facts: ['中文名来自向上反弯的嘴', '像扫帚一样左右摆嘴觅食', '黑白羽色在开阔浅滩很醒目'],
      tip: '退潮时为鸟群留下完整觅食空间,不穿越集中活动区域。',
      arrivesShenzhenBay: '冬候鸟,秋冬可见',
      migrationRoute: '繁殖于中国北方及中亚湿地 → 越冬于东亚—澳大利西亚迁飞区南段沿海,深圳湾为节点之一。',
      quiz: [
        { q: '反嘴鹬的嘴形是?', options: ['直的', '向上反弯', '向下钩', '扁平'], answer: 1 }
      ],
      ai: [
        { k: ['几月', '来深湾'], a: '反嘴鹬为深圳湾冬候鸟,秋冬可见,春季北返繁殖地。' },
        { k: ['区别', '识别'], a: '它黑白羽色、嘴向上反弯,觅食时左右扫动,非常独特。' },
        { k: ['保护', '等级'], a: '反嘴鹬为无危(LC)。' }
      ]
    },
    {
      id: 'great-cormorant', name: '普通鸬鹚', enName: 'Great Cormorant',
      emoji: '🐧', category: 'bird', color: '#3a4a55', status: '无危(LC)',
      habitat: '海湾、河口、水库与鱼塘',
      intro: '普通鸬鹚是大型深色水鸟,嘴端带钩,善于潜水捕鱼。秋冬常能在深圳湾水面或岸边设施上看到它们晾翅。',
      facts: ['潜水主要用脚推动身体', '张开翅膀常是在晾羽', '嘴尖小钩利于抓鱼'],
      tip: '不要靠近鸬鹚集中休息点,也不要投喂或干扰其捕鱼。',
      arrivesShenzhenBay: '冬候鸟,秋冬季数量多',
      migrationRoute: '北方种群秋冬季南迁至中国南方沿海越冬,深圳湾及附近水域常见。',
      quiz: [
        { q: '普通鸬鹚张开双翅通常是为了?', options: ['准备起飞', '晾晒羽毛', '求偶', '游泳'], answer: 1 }
      ],
      ai: [
        { k: ['几月', '来深湾'], a: '普通鸬鹚为冬候鸟,秋冬季在深圳湾及附近水域数量较多。' },
        { k: ['区别', '识别'], a: '它通体深色、嘴带钩、善潜水,常成群停在设施上晾翅。' },
        { k: ['保护', '等级'], a: '普通鸬鹚为无危(LC)。' }
      ]
    },
    {
      id: 'kandelia', name: '秋茄', enName: 'Kandelia obovata',
      emoji: '🌱', category: 'plant', color: '#3fae7a', status: '乡土红树',
      habitat: '深圳湾红树林高潮带',
      intro: '秋茄是华南红树林的建群种之一,胎生繁殖(种子在母树上萌发成胚轴后脱落插进泥中),是固岸护堤、哺育底栖生物的关键红树植物。',
      facts: ['典型胎生红树,胚轴像小铅笔', '密集根系为鱼虾蟹提供庇护', '能减缓波浪、促淤保滩'],
      tip: '红树林是保护区核心,请远观勿踏入、勿采摘。',
      arrivesShenzhenBay: '多年生乔木,四季常绿',
      migrationRoute: '红树植物不迁徙;作为栖息地,它支撑着东亚—澳大利西亚迁飞区候鸟的停歇与补给。',
      quiz: [
        { q: '秋茄最特别的繁殖方式是?', options: ['种子随风远飞', '胎生(胚轴在母树萌发)', '靠鸟类传播', '孢子繁殖'], answer: 1 }
      ],
      ai: [
        { k: ['区别', '识别'], a: '秋茄叶片厚革质、卵形,有突出的呼吸根与铅笔状胚轴,是深圳湾高潮带常见红树。' },
        { k: ['保护', '作用'], a: '秋茄是红树林建群种,固岸护堤、净化水质,并为底栖动物与候鸟提供食物和庇护。' },
        { k: ['迁徙', '候鸟'], a: '红树植物本身不迁徙,但红树林为迁飞区候鸟提供关键栖息地。' }
      ]
    },
    {
      id: 'avicennia', name: '白骨壤', enName: 'Avicennia marina',
      emoji: '🌿', category: 'plant', color: '#7fae8a', status: '乡土红树',
      habitat: '深圳湾红树林中低潮带',
      intro: '白骨壤(白骨土)是分布最广的红树植物之一,以指状呼吸根著称,能在缺氧的淤泥中呼吸,是红树林前缘的先锋树种。',
      facts: ['有密集的指状呼吸根伸出泥面', '叶片背面有盐腺可排盐', '是红树林向海一侧的先锋种'],
      tip: '潮间带泥滩松软且有呼吸根,请勿踩踏红树根系。',
      arrivesShenzhenBay: '多年生乔木,四季常绿',
      migrationRoute: '红树植物不迁徙;其生境支撑迁飞区候鸟的停歇与觅食。',
      quiz: [
        { q: '白骨壤适应淤泥缺氧环境的特征是?', options: ['高大树干', '指状呼吸根', '无根', '气生茎'], answer: 1 }
      ],
      ai: [
        { k: ['区别', '识别'], a: '白骨壤有伸出的指状呼吸根,叶背常泛白(盐腺排盐),多位于红树林向海前缘。' },
        { k: ['保护', '作用'], a: '白骨壤是红树林先锋树种,固滩护岸、为潮间带生物提供生境。' },
        { k: ['迁徙', '候鸟'], a: '红树植物不迁徙,但红树林整体是迁飞区候鸟的重要栖息地。' }
      ]
    }
  ];

  // ---- 本地存储工具 ----
  const PREFIX = 'yjsw:engage:';
  const Store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(PREFIX + key); return v == null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch (e) {}
    }
  };

  // 已解锁物种 id 集合
  const Unlock = {
    all() { return Store.get('unlocked', ['black-faced-spoonbill']); }, // 默认解锁第一个
    has(id) { return this.all().includes(id); },
    unlock(id) {
      const s = this.all();
      if (!s.includes(id)) { s.push(id); Store.set('unlocked', s); }
      return s;
    },
    mastered(id) { return Store.get('mastered', []).includes(id); },
    master(id) {
      const s = Store.get('mastered', []);
      if (!s.includes(id)) { s.push(id); Store.set('mastered', s); }
      return s;
    }
  };

  // ---- DOM 构建工具 ----
  // el('div', {class:'x', onclick:fn, style:{'--c':'#fff'}}, [children])
  function el(tag, props, children) {
    const node = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null) continue;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'style' && typeof v === 'object') {
          for (const sk in v) {
            if (sk.startsWith('--')) node.style.setProperty(sk, v[sk]);
            else node.style[sk] = v[sk];
          }
        } else if (k.startsWith('on') && typeof v === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (k === 'dataset' && typeof v === 'object') {
          for (const dk in v) node.dataset[dk] = v[dk];
        } else {
          node.setAttribute(k, v);
        }
      }
    }
    if (children != null) {
      const list = Array.isArray(children) ? children : [children];
      for (const c of list) {
        if (c == null || c === false) continue;
        node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
      }
    }
    return node;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function timeAgo(ts) {
    const d = Date.now() - ts;
    const m = 60000, h = 3600000, day = 86400000;
    if (d < m) return '刚刚';
    if (d < h) return Math.floor(d / m) + ' 分钟前';
    if (d < day) return Math.floor(d / h) + ' 小时前';
    return Math.floor(d / day) + ' 天前';
  }

  let toastTimer = null;
  function toast(msg) {
    let t = document.getElementById('eng-toast');
    if (!t) { t = el('div', { id: 'eng-toast' }); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // 本地 AI 关键词应答引擎
  function localAnswer(sp, question) {
    const q = String(question || '').toLowerCase();
    const pairs = (sp && sp.ai) || [];
    let best = null, bestScore = 0;
    for (const p of pairs) {
      let score = 0;
      for (const kw of p.k) if (q.includes(kw.toLowerCase())) score += 2;
      if (score > bestScore) { bestScore = score; best = p.a; }
    }
    if (best) return best;
    // 兜底:基于结构化字段回答
    if (/几月|什么时候|季节|来深湾/.test(q) && sp.arrivesShenzhenBay) return sp.arrivesShenzhenBay + '。';
    if (/迁徙|路线|从哪|去哪/.test(q) && sp.migrationRoute) return sp.migrationRoute;
    if (/保护|等级|濒危/.test(q) && sp.status) return sp.name + '的保护等级为:' + sp.status + '。';
    if (/习性|吃什么|栖息|住哪/.test(q) && sp.habitat) return sp.name + '栖息于' + sp.habitat + '。' + (sp.intro || '');
    return null;
  }

  global.EcoKnowledge = {
    SPECIES,
    byId(id) { return SPECIES.find(s => s.id === id) || null; },
    byName(name) { return SPECIES.find(s => s.name === name) || null; },
    Store, Unlock, el, escapeHtml, timeAgo, toast, localAnswer
  };
})(window);
