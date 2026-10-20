// ============================================================
// ch01.js — 第 1 章《数据》双语内容模型（讲解 / 代码 / 演示 数据源）
// 块类型：p h list table case theory key pit tip code demo
// ============================================================
export default {
  id: '01',
  title: { zh: '数据', en: 'Data' },
  lede: {
    zh: '从 DeepSeek 合成的新生数据出发，讲清数据从哪来、是什么、怎么变换、又如何被 D3 绑定到图形上。',
    en: 'From DeepSeek-generated student data, learn where data comes from, what it is, how it is transformed, and how D3 binds it to graphics.'
  },
  objectives: {
    zh: [
      '理解数据的本质（DIKW 金字塔）与可视化在其中的位置',
      '掌握 Stevens 测量尺度 × Mackinlay 视觉通道的匹配原则',
      '熟练使用 D3 数据加载与 8 个函数式数据转换 API',
      '理解 D3 Selection 的 enter / update / exit 三态模型',
      '掌握 13 个 ⭐ JavaScript 关键编程点'
    ],
    en: [
      'Understand the nature of data (DIKW) and where visualization sits',
      'Master Stevens’ scales × Mackinlay’s channel mapping',
      'Use D3 data loading and the 8 functional array operations',
      'Understand the D3 Selection enter/update/exit lifecycle',
      'Master 13 key JavaScript programming points'
    ]
  },
  sections: [
    {
      id: '1.1',
      title: { zh: '数据生成', en: 'Data Generation' },
      sub: { zh: '基于新生数据（DeepSeek 合成）讲解异步加载与字段映射', en: 'Async loading and field mapping using DeepSeek-generated student data' },
      blocks: [
        
        { t: 'theory', title: { zh: '嵌入理论：AI 合成数据的可信度边界', en: 'Theory: the trustworthiness boundary of AI-synthesized data' }, body: [
          { t: 'table', head: [{ zh: '维度', en: 'Dimension' }, { zh: '含义', en: 'Meaning' }, { zh: 'DeepSeek 生成数据', en: 'DeepSeek data' }],
            rows: [
              [{ zh: '准确性', en: 'Accuracy' }, { zh: '反映真实世界的程度', en: 'Fidelity to the real world' }, { zh: '⚠ 姓名 / 籍贯虚构', en: '⚠ names / hometowns fictional' }],
              [{ zh: '完整性', en: 'Completeness' }, { zh: '必填字段是否齐全', en: 'Required fields present' }, { zh: '✅ 字段齐全', en: '✅ complete' }],
              [{ zh: '一致性', en: 'Consistency' }, { zh: '同一概念表达一致', en: 'Same concept expressed consistently' }, { zh: '✅ 字段一致', en: '✅ consistent' }],
              [{ zh: '时效性', en: 'Timeliness' }, { zh: '数据反映当前状态', en: 'Reflects current state' }, { zh: '✅ 入学年份匹配', en: '✅ enrollment year matches' }]
            ] },
          { t: 'p', x: { zh: '<strong>采样偏差：</strong>生成模型倾向于产出“看起来合理”的分布——民族偏汉族、籍贯偏大城市，使用时要意识到这一点。', en: '<strong>Sampling bias:</strong> generative models favor “plausible” distributions — mostly Han ethnicity, big-city hometowns. Keep this in mind when using the data.' } }
        ]},
        { t: 'code', lang: 'js', title: { zh: '① 字段名映射', en: '① Field-name mapping' },
          code: `// ⭐ 把中文 CSV 列名映射为英文 JS 变量
const COLUMN_MAP = {
  "序号": "id",
  "姓名": "name",
  "性别": "gender",
  "生日": "birthday",
  "年龄": "age",
  "班级": "class",
};`,
          notes: [
            { type: 'why', h: { zh: '为什么不用中文 key？', en: 'Why not Chinese keys?' },
              x: { zh: 'JS 引擎对中文标识符容错性差；后端、JSON、URL 编码都可能引入乱码；IDE 自动补全、搜索、重构对中文支持不一致。最佳实践：CSV 用人可读中文，JS 内部统一英文变量。', en: 'Engines tolerate Chinese identifiers poorly; back-end, JSON and URL encoding can introduce mojibake; IDE autocomplete/search/refactor support is inconsistent. Keep Chinese column names in the CSV, English variables inside JS.' } }
          ] },
        { t: 'code', lang: 'js', title: { zh: '② 类型转换函数', en: '② Type-conversion function' },
          code: `function transformRow(d) {
  return {
    id:       +d["序号"],            // 一元 + 把字符串转 Number
    name:     d["姓名"].trim(),      // trim() 去掉首尾空白
    birthday: new Date(d["生日"]),    // 字符串 → Date
    age:      +d["年龄"],
    class:    d["班级"].trim(),
  };
}`,
          notes: [
            { type: 'why', h: { zh: '关键点', en: 'Key points' },
              x: { zh: '<code>+d["年龄"]</code> 是一元加运算符，把字符串转数字最快；<code>new Date(str)</code> 对 <code>"2007/8/15"</code> 兼容性差，必要时用 <code>d3.timeParse("%Y-%m-%d")</code> 兜底。', en: '<code>+x</code> is the fastest string→number cast; <code>new Date(str)</code> poorly parses <code>"2007/8/15"</code> — fall back to <code>d3.timeParse("%Y-%m-%d")</code> when needed.' } },
            { type: 'warn', h: { zh: '坑', en: 'Pitfall' },
              x: { zh: '没有 <code>trim()</code>，<code>"软件工程1班 "</code> 尾部的空格会让后续过滤、聚合全部出错。', en: 'Without <code>trim()</code>, a trailing space in <code>"SE1 "</code> silently breaks later filtering and grouping.' } }
          ] },
        { t: 'code', lang: 'js', title: { zh: '③ d3.csv 第二参直接传 row 回调', en: '③ Pass the row callback to d3.csv' },
          code: `// 一行完成加载 + 转换
const data = await d3.csv("data/newstudent.csv", transformRow);

console.log(typeof data[0].age);               // "number"
console.log(data[0].birthday instanceof Date); // true`,
          notes: [
            { type: 'why', h: { zh: '为什么这一行很重要', en: 'Why this matters' },
              x: { zh: '<code>d3.csv</code> 是异步的，必须 <code>await</code>；第二参的 row 回调在<strong>每一行解析后立即</strong>执行，比“先加载再 map”更省内存；异步加载不阻塞页面渲染。', en: '<code>d3.csv</code> is async and must be awaited; the row callback runs <strong>immediately after each row parses</strong>, saving memory vs “load then map”; async loading never blocks rendering.' } }
          ] },
        { t: 'demo', id: 'd01-1', title: { zh: '数据流水线动画（解析 → 转型 → 重命名）', en: 'Data pipeline animation (parse → cast → rename)' },
          x: { zh: '点「单步 / 播放」，让一行真实 CSV 依次流过解析、行回调类型转换、字段重命名三台机器；打开「注入脏数据」看 NaN 与尾部空白如何被发现。', en: 'Step/play a real CSV row through parse, row() type casting and key renaming; toggle a dirty row to see NaN and trailing spaces caught.' } }
      ]
    },
    {
      id: '1.2',
      title: { zh: '数据定义（DIKW）', en: 'Data Definition (DIKW)' },
      sub: { zh: '数据 → 信息 → 知识 → 智慧', en: 'Data → Information → Knowledge → Wisdom' },
      blocks: [
        
        { t: 'theory', title: { zh: '嵌入理论：可视化在 DIKW 中的位置', en: 'Theory: where visualization sits in DIKW' }, body: [
          { t: 'p', x: { zh: '<strong>关键洞见：</strong>可视化主要把 <strong>Data 升到 Information</strong>，少数场景升到 Knowledge，难以跨越到 Wisdom。', en: '<strong>Key insight:</strong> visualization mostly moves <strong>Data to Information</strong>, occasionally to Knowledge, and rarely reaches Wisdom.' } },
          { t: 'list', x: [
            { zh: '✅ Data → Information：把表格“翻译”成可读图形（折线、柱状、热力）', en: '✅ Data → Information: translate a table into readable charts' },
            { zh: '⚠ Information → Knowledge：模式发现常需统计模型辅助', en: '⚠ Information → Knowledge: pattern discovery often needs statistical models' },
            { zh: '❌ Knowledge → Wisdom：决策与战略超出可视化能力', en: '❌ Knowledge → Wisdom: decisions and strategy are beyond visualization' }
          ]},
          { t: 'p', x: { zh: 'Rowley (2007) 批评 DIKW 是过度简化的层次模型，但作为教学脚手架仍然最有价值。', en: 'Rowley (2007) criticizes DIKW as an over-simplification, but it remains a valuable teaching scaffold.' } }
        ]},
        { t: 'code', lang: 'js', title: { zh: '① SVG 金字塔路径', en: '① SVG pyramid path' },
          code: `// 梯形：从上到下四个点连线
const topW = 60, botW = 120;
const yTop = 20, yBot = 100;
const path = \`M \${cx - topW/2} \${yTop}
  L \${cx + topW/2} \${yTop}
  L \${cx + botW/2} \${yBot}
  L \${cx - botW/2} \${yBot} Z\`;`,
          notes: [
            { type: 'why', h: { zh: '关键点', en: 'Key points' },
              x: { zh: '<code>M</code>(moveto)、<code>L</code>(lineto)、<code>Z</code>(close) 是最常用的三个 path 指令；模板字符串 <code>${...}</code> 直接嵌入变量比字符串拼接可读。复杂形状可用 <code>d3.symbol()</code>（内置 ★●▲）。', en: '<code>M</code>, <code>L</code>, <code>Z</code> are the three most-used path commands; template literals are far more readable than concatenation. Use <code>d3.symbol()</code> for complex shapes.' } }
          ] },
        { t: 'code', lang: 'js', title: { zh: '② 交互高亮（事件）', en: '② Interactive highlight (events)' },
          code: `const g = svg.append("g")
  .style("cursor", "pointer")
  .on("mouseover", function () {   // ⚠ 必须 function，不能箭头函数
    d3.select(this).select("path")
      .transition().duration(150)
      .attr("fill", d3.color(layer.color).brighter(0.5));
  })
  .on("click", () => showDetail(layer)); // 不用 this 时箭头函数 OK`,
          notes: [
            { type: 'warn', h: { zh: 'D3 最常见的坑', en: 'The most common D3 pitfall' },
              x: { zh: '事件回调里必须用 <code>function()</code> 而非箭头函数——因为要靠 <code>this</code> 访问当前元素，箭头函数捕获外层 <code>this</code> 会失效。', en: 'Use <code>function()</code>, not an arrow, in event callbacks that need <code>this</code> to be the current element; arrows capture the outer <code>this</code> and break.' } }
          ] },
        { t: 'demo', id: 'd01-2', title: { zh: '数据精炼——80 条记录如何变成一个决策', en: 'Refining data — 80 records into one decision' },
          x: { zh: '播放或点右侧层级，看 80 个散点如何聚成性别分组（信息）、年龄分布（知识）、最终凝练为一个决策（智慧），直观感受 DIKW 抽象层级。', en: 'Play or click a layer to watch 80 dots cluster into gender groups (information), an age distribution (knowledge), and finally one decision (wisdom).' } }
      ]
    },
    {
      id: '1.3',
      title: { zh: '数据属性', en: 'Data Attributes' },
      sub: { zh: 'Stevens 测量尺度 × Mackinlay 视觉通道排序', en: 'Stevens scales × Mackinlay channel ranking' },
      blocks: [
        
        { t: 'theory', title: { zh: 'Stevens 测量尺度（1946）—— 4 类', en: 'Stevens measurement scales (1946) — 4 types' }, body: [
          { t: 'table', head: [{ zh: '类别', en: 'Type' }, { zh: '允许的运算', en: 'Allowed ops' }, { zh: '示例', en: 'Examples' }, { zh: '对应原文', en: 'Maps to' }],
            rows: [
              [{ zh: '名义 Nominal', en: 'Nominal' }, { zh: '等价 / 不等价', en: '= / ≠' }, { zh: '姓名、性别', en: 'name, gender' }, { zh: '类别型', en: 'categorical' }],
              [{ zh: '序数 Ordinal', en: 'Ordinal' }, { zh: '加上 > <', en: '+ > <' }, { zh: '等级、班级序号', en: 'rank, class no.' }, { zh: '序数型', en: 'ordinal' }],
              [{ zh: '区间 Interval', en: 'Interval' }, { zh: '加上加减', en: '+ + −' }, { zh: '温度（°C）', en: 'temperature (°C)' }, { zh: '—', en: '—' }],
              [{ zh: '比率 Ratio', en: 'Ratio' }, { zh: '加上乘除', en: '+ × ÷' }, { zh: '年龄、价格', en: 'age, price' }, { zh: '数值型', en: 'quantitative' }]
            ] },
          { t: 'p', x: { zh: '<strong>关键区别：</strong>区间尺度没有“真零点”（0°C 不是没有温度）；比率尺度有真零点（0 元 = 没有钱）。', en: '<strong>Key distinction:</strong> interval scales have no true zero (0°C is not “no temperature”); ratio scales do (¥0 = no money).' } }
        ]},
        { t: 'theory', title: { zh: 'Mackinlay 视觉通道排序（1986）', en: 'Mackinlay visual-channel ranking (1986)' }, body: [
          { t: 'table', head: [{ zh: '档次', en: 'For' }, { zh: '通道', en: 'Channels' }, { zh: '适合属性', en: 'Suited to' }],
            rows: [
              [{ zh: '定量型', en: 'Quantitative' }, { zh: '位置、长度、角度', en: 'position, length, angle' }, { zh: '比率 / 区间', en: 'ratio / interval' }],
              [{ zh: '顺序型', en: 'Ordering' }, { zh: '亮度、密度、饱和度', en: 'lightness, density, saturation' }, { zh: '序数', en: 'ordinal' }],
              [{ zh: '定性型', en: 'Nominal' }, { zh: '色相、形状', en: 'hue, shape' }, { zh: '名义', en: 'nominal' }]
            ] },
          { t: 'p', x: { zh: '<strong>核心发现：</strong>位置是最强的定量通道，色相是最强的定性通道。<strong>错配 → 信息丢失。</strong>', en: '<strong>Core finding:</strong> position is the strongest quantitative channel; hue is the strongest nominal channel. <strong>Mismatch → information loss.</strong>' } }
        ]},
        { t: 'code', lang: 'js', title: { zh: '① 比例尺选型', en: '① Scale selection' },
          code: `// 比率型 → scaleLinear（连续定量）
const x = d3.scaleLinear().domain([0, 100]).range([0, 800]);

// 名义/序数型 → scaleBand（离散分类）
const xb = d3.scaleBand()
  .domain(["软件1班", "软件2班", "数据1班"])
  .range([0, 800]);`,
          notes: [
            { type: 'why', h: { zh: '关键点', en: 'Key points' },
              x: { zh: '<code>domain()</code> 是数据域（输入），<code>range()</code> 是值域（输出像素）。类别数据误用 scaleLinear 会算出无意义的中间值（如 0.5 班）。口诀：连续定量用 Linear，离散分类用 Band，序数可用 Point。', en: '<code>domain()</code> is the data domain (input), <code>range()</code> the output pixels. A scaleLinear on categories yields meaningless mid-values (e.g. class 0.5). Rule: continuous→Linear, discrete→Band, ordinal→Point.' } }
          ] },
        { t: 'code', lang: 'js', title: { zh: '② colormap 选型', en: '② Colormap selection' },
          code: `// 顺序型（顺序有意义）→ Viridis / Blues，CVD 友好
const c1 = d3.scaleSequential(d3.interpolateViridis);
// 定性型（无顺序）→ Tableau10
const c2 = d3.scaleOrdinal().range(d3.schemeTableau10);
// 发散型（有中点）→ RdBu
const c3 = d3.scaleDiverging(d3.interpolateRdBu);`,
          notes: [
            { type: 'why', h: { zh: '关键点', en: 'Key points' },
              x: { zh: 'Viridis 是顺序 colormap 标杆，感知均匀且 CVD 友好；有“中间值”（正负、偏离均值）的数据用发散型。', en: 'Viridis is the benchmark sequential map — perceptually uniform and CVD-friendly; use a diverging map when there is a meaningful midpoint.' } },
            { type: 'warn', h: { zh: '常见错误', en: 'Common mistake' },
              x: { zh: '用彩虹色 <code>interpolateRainbow</code> 编码数值——既不 CVD 友好，又制造不存在的边界。', en: 'Encoding numbers with <code>interpolateRainbow</code> — not CVD-friendly and introduces artificial boundaries.' } }
          ] },
        { t: 'demo', id: 'd01-3', title: { zh: '视觉通道拖拽编码工作台（含可读性评分）', en: 'Drag-and-drop encoding workbench (with a readability score)' },
          x: { zh: '把字段拖到 x / y / 颜色 / 大小 / 形状通道，图形实时重绘并打分；分别把「年龄」拖到颜色与 x 位置，亲自验证数值变量的通道有效性差异。', en: 'Drag fields onto x/y/color/size/shape channels; the chart redraws and scores readability. Map age to color vs to position to feel the effectiveness gap.' } }
      ]
    },
    {
      id: '1.4',
      title: { zh: '数据变换', en: 'Data Transformation' },
      sub: { zh: 'D3 8 个函数式数组操作', en: 'Eight functional array operations in D3' },
      blocks: [
        
        { t: 'theory', title: { zh: '嵌入理论：函数式数据流', en: 'Theory: functional data flow' }, body: [
          { t: 'list', x: [
            { zh: '✅ 不可变：输入不变，返回新数组', en: '✅ Immutable: input unchanged, returns a new array' },
            { zh: '✅ 纯函数：相同输入 → 相同输出', en: '✅ Pure: same input → same output' },
            { zh: '✅ 可链式：返回值可接下一层变换', en: '✅ Chainable: output feeds the next transform' }
          ]},
          { t: 'p', x: { zh: '为什么函数式？可推理（每层独立可测）、可并行（map/reduce 天然并行）、可缓存（纯函数可记忆化）。<code>transpose</code> 做宽/长转换，<code>group + rollup</code> 对应 OLAP 的切片/切块/钻取。', en: 'Why functional? It is predictable (each layer testable), parallelizable (map/reduce), and cacheable. <code>transpose</code> reshapes wide/long; <code>group + rollup</code> mirror OLAP slice/dice/drill.' } }
        ]},
        { t: 'code', lang: 'js', title: { zh: '① map / reduce 链式组合', en: '① Chained map / reduce' },
          code: `const avgAge =
  students
    .filter(s => s.gender === "男")  // ① 过滤男生
    .map(s => s.age)                 // ② 提取年龄
    .reduce((sum, a) => sum + a, 0)  // ③ 合计
  / students.filter(s => s.gender === "男").length; // ④ 平均`,
          notes: [
            { type: 'why', h: { zh: '关键点', en: 'Key points' },
              x: { zh: '链式每一步返回新数组，不修改原数组；命令式需要 4 个临时变量加一个循环，函数式一行表达。', en: 'Each step returns a new array without mutating the input; the imperative version needs 4 temp vars and a loop.' } },
            { type: 'warn', h: { zh: '性能权衡', en: 'Trade-off' },
              x: { zh: '每次 map/filter 都新建数组，百万级以上才有显著性能损耗，教学规模可忽略。', en: 'Each map/filter allocates a new array; cost only matters at millions of rows, irrelevant here.' } }
          ] },
        { t: 'code', lang: 'js', title: { zh: '② cross 笛卡尔积', en: '② cross product' },
          code: `const genders = ["男", "女"];
const majors  = ["软件工程", "数据科学"];
d3.cross(genders, majors);
// [["男","软件工程"],["男","数据科学"],
//  ["女","软件工程"],["女","数据科学"]]`,
          notes: [
            { type: 'why', h: { zh: '关键点', en: 'Key points' },
              x: { zh: '常用于“两两组合”分析（如性别 × 专业人数）；第二参可选 reducer；n 个数组的笛卡尔积大小是各长度的乘积。', en: 'Handy for pair-wise analysis (gender × major); an optional reducer is the second argument; the size is the product of lengths.' } }
          ] },
        { t: 'code', lang: 'js', title: { zh: '③ group / rollup 层次聚合', en: '③ group / rollup' },
          code: `// group：保留每个 key 的所有元素 → Map
const byClass = d3.group(students, s => s.class);

// rollup：每个 key 只保留聚合值 → Map
const countByClass = d3.rollup(
  students,
  v => v.length,   // reducer
  s => s.class     // key 提取
);`,
          notes: [
            { type: 'why', h: { zh: '关键点', en: 'Key points' },
              x: { zh: '<code>group</code> 是“分组保留”，<code>rollup</code> 是“分组聚合”；rollup 第二参是 reducer。第 2 章会用 rollup 构建树形数据。', en: '<code>group</code> keeps elements per key; <code>rollup</code> reduces them to one value; the second arg is the reducer. Chapter 2 uses rollup for trees.' } }
          ] },
        { t: 'demo', id: 'd01-4', title: { zh: '数据变换算子流水线（图形化）', en: 'Visual operator pipeline for data transforms' },
          x: { zh: '单序列模式下把 map/filter/reduce/pairs 串成流水线，看数字方块如何变形；分组/配对模式下看 group、rollup、cross、zip、merge、transpose 如何改变数据形状。', en: 'Chain map/filter/reduce/pairs and watch number boxes transform; switch to group/pair mode to see group, rollup, cross, zip, merge, transpose reshape data.' } }
      ]
    },
    {
      id: '1.5',
      title: { zh: 'D3 选择器与 Data-Join', en: 'Selectors & Data-Join' },
      sub: { zh: 'Selection 与 enter / update / exit 三态模型', en: 'Selections and the enter/update/exit lifecycle' },
      blocks: [
        
        { t: 'theory', title: { zh: '嵌入理论：Data-Join 三态模型', en: 'Theory: the Data-Join three-state model' }, body: [
          { t: 'p', x: { zh: 'D3 的核心是 <strong>Data-Join</strong>：把数据数组“绑定”到 DOM 元素上。数据变化时：', en: 'The core of D3 is the <strong>Data-Join</strong>: bind a data array to DOM elements. When data changes:' } },
          { t: 'list', x: [
            { zh: '新数据 > 旧数据：多出来的进入 <strong>enter</strong>（要 append）', en: 'new > old: extras enter <strong>enter</strong> (append)' },
            { zh: '新数据 = 旧数据：原有元素进入 <strong>update</strong>（改属性）', en: 'new = old: existing elements are <strong>update</strong> (restyle)' },
            { zh: '新数据 < 旧数据：多余元素进入 <strong>exit</strong>（要 remove）', en: 'new < old: surplus elements are <strong>exit</strong> (remove)' }
          ]}
        ]},
        { t: 'code', lang: 'js', title: { zh: '① join(enter, update, exit) 三态', en: '① join(enter, update, exit)' },
          code: `svg.selectAll("circle")
  .data(currentData)
  .join(
    enter  => enter.append("circle").attr("fill", "green"), // enter
    update => update.attr("fill", "cyan"),                  // update
    exit   => exit.remove()                                 // exit
  );`,
          notes: [
            { type: 'why', h: { zh: '关键点', en: 'Key points' },
              x: { zh: 'join 的三个回调分别在三态阶段执行，比 v3 的 <code>enter().append()</code> + <code>exit().remove()</code> 更简洁。类比：React 的 diff + patch，D3 让你自己写变换函数。', en: 'The three callbacks handle each phase, more concise than v3’s enter/exit calls. Analogous to React’s diff+patch, but you write the transforms yourself.' } }
          ] },
        { t: 'code', lang: 'js', title: { zh: '② key 函数保身份', en: '② The key function preserves identity' },
          code: `// ❌ 不带 key：按 index 绑定，重排后动画错乱
svg.selectAll("circle").data(newData);

// ✅ 带 key：用唯一字段绑定身份（等同 React 的 key={item.id}）
svg.selectAll("circle").data(newData, d => d.id);`,
          notes: [
            { type: 'why', h: { zh: 'key 函数是 D3 动画的灵魂', en: 'The key is the soul of D3 animation' },
              x: { zh: '没有 key 时按 index 绑定，数据重排会让所有元素“换位”；带 key 后每个圆知道自己的 id，重排时只是位置平滑过渡，动画自然。', en: 'Without a key, D3 binds by index, so reordering makes everything “jump”; with a key, each circle tracks its id and smoothly moves.' } }
          ] },
        { t: 'code', lang: 'js', title: { zh: '③ select vs selectAll', en: '③ select vs selectAll' },
          code: `// select：返回第一个匹配，操作单个元素
const title = d3.select("#title");

// selectAll：返回多个元素，批量绑定数据
const bars = svg.selectAll(".bar").data(values);`,
          notes: [
            { type: 'warn', h: { zh: '常见错误', en: 'Common mistake' },
              x: { zh: '用 <code>selectAll(".bar")</code> 绑定数据时元素数量必须匹配，否则“留空”或“溢出”；最佳实践是先 selectAll 占位（可能为空），再 <code>.data().join()</code>。', en: 'When binding data, element counts must match or you get blanks/overflow; best practice: selectAll placeholders first (possibly empty), then <code>.data().join()</code>.' } }
          ] },
        { t: 'demo', id: 'd01-5', title: { zh: '数据 ↔ DOM 配对——key 如何保住元素身份', en: 'Data ↔ DOM pairing — how a key preserves identity' },
          x: { zh: '左数据卡、右 DOM 柱，连线表示绑定。添加/更新/删除看 enter/update/exit 三态；关键是分别在「有 key」与「无 key（按索引）」下点洗牌，看柱子是否跟随卡片、数值是否张冠李戴。', en: 'Lines bind data cards to DOM bars. Add/update/delete to see enter/update/exit; crucially, shuffle with and without a key to see whether bars follow cards or swap values.' } }
      ]
    }
  ],
  summary: {
    zh: [
      '数据是原始观察，可视化主要把 Data 升到 Information，DIKW 是理解这一过程的脚手架。',
      '属性类型决定视觉通道：定量→位置、序数→亮度、名义→色相；错配会丢失信息。',
      'D3 用函数式、不可变的数组操作清洗数据，再通过 Data-Join 把数据绑定到图形。',
      'Data-Join 的 enter/update/exit 三态与 key 函数，是 D3 动态可视化的核心。'
    ],
    en: [
      'Data are raw observations; visualization mostly moves Data to Information; DIKW scaffolds this process.',
      'Attribute type determines channel: quantitative→position, ordinal→lightness, nominal→hue; mismatches lose information.',
      'D3 cleans data with functional, immutable array ops, then binds data to graphics via Data-Join.',
      'The enter/update/exit lifecycle and the key function are the core of D3 dynamic visuals.'
    ]
  },
  quickref: [
    { tag: '1.1', x: { zh: '① 字段映射 ② 类型转换 ③ d3.csv 第二参回调', en: '① field mapping ② type conversion ③ row callback' } },
    { tag: '1.2', x: { zh: '① SVG path ② function vs 箭头函数', en: '① SVG path ② function vs arrow' } },
    { tag: '1.3', x: { zh: '① scale 选型 ② colormap 选型', en: '① scale choice ② colormap choice' } },
    { tag: '1.4', x: { zh: '① 链式组合 ② cross ③ group/rollup', en: '① chaining ② cross ③ group/rollup' } },
    { tag: '1.5', x: { zh: '① join 三态 ② key 函数 ③ select/selectAll', en: '① join ② key ③ select/selectAll' } }
  ],
  quiz: [
    { q: { zh: '给一组“专业名称”，应该用什么视觉通道？为什么？', en: 'Which visual channel suits “major name”, and why?' },
      a: { zh: '名义（类别）数据，用色相或形状（定性通道）；它没有顺序和大小，不能用位置长度或亮度。', en: 'Nominal data → hue or shape (identity channels); it has no order or magnitude, so position/length/lightness are wrong.' } },
    { q: { zh: '为什么给数据绑定元素时要传 key 函数？', en: 'Why pass a key function when binding data?' },
      a: { zh: 'key 用唯一字段稳定元素身份，数据重排时元素按 id 平滑移动而不是整体错位；与 React 的 key 同理。', en: 'The key stabilizes identity via a unique field, so on reorder elements move by id instead of being rematched by index — same idea as React’s key.' } },
    { q: { zh: '0°C 和 0 元在测量尺度上有什么本质区别？', en: 'What is the essential difference between 0°C and ¥0?' },
      a: { zh: '温度是区间尺度，0°C 不是真零点（仍有温度）；金额是比率尺度，0 元是真零点，可作乘除与比例。', en: 'Temperature is interval (0°C is not a true zero); money is ratio (¥0 is a true zero, allowing ratios and multiplication).' } }
  ]
};
