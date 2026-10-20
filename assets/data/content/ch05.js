// ============================================================
// ch05.js — 第 5 章《时序数据可视化》双语内容模型（讲解 / 代码 / 演示 数据源）
// ============================================================
export default {
  id: '05',
  title: { zh: '时序数据可视化', en: 'Temporal Data Visualization' },
  lede: {
    zh: '时间不是普通的数值轴。它有五个属性，决定了该用什么图：标准折线看趋势、日历热图看年内异常与周末、阿基米德螺旋看周期、Storyline 看多角色的聚散。每个图都配可交互演示，让你亲手"读"出时间结构。',
    en: 'Time is not an ordinary axis. Five attributes decide the chart: line charts for trend, calendar heatmaps for yearly anomalies and weekends, Archimedean spirals for periodicity, and Storylines for multi-character convergence. Each chart has an interactive demo.'
  },
  objectives: {
    zh: [
      '说出时间的 5 个属性（有序/连续/周期/独立于空间/结构性），并据此为场景选图',
      '用 scaleTime 把时间映射到 x，理解标准折线图的能力与局限',
      '会做年历热图（van Wijk）、12 月小倍数与星期×月循环，发现周期与异常',
      '理解阿基米德螺旋如何把同相位周期对齐到同一角度',
      '掌握 Storyline 三要素，用 y 距离表达关系并区分 Alluvial/桑基'
    ],
    en: [
      'Name the five time attributes and choose charts by scenario',
      'Map time to x with scaleTime and know the line chart’s strengths and limits',
      'Build year calendars, month multiples and weekday×month cycles to find periods and anomalies',
      'Understand how an Archimedean spiral aligns same-phase cycles to one angle',
      'Master Storyline’s three elements, encode relationships by y-distance, and distinguish Alluvial/Sankey'
    ]
  },
  sections: [
    {
      id: '5.1',
      title: { zh: '时间的五个属性', en: 'Five Attributes of Time' },
      sub: { zh: '先判断场景里时间扮演什么角色，再决定怎么画', en: 'Identify what time does in the scenario before choosing the chart' },
      blocks: [
        { t: 'table', head: [{ zh: '属性', en: 'Attribute' }, { zh: '含义', en: 'Meaning' }, { zh: '典型场景', en: 'Example' }, { zh: '推荐图', en: 'Chart' }],
          rows: [
            [{ zh: '有序性', en: 'ordered' }, { zh: '事件有先后、连因果', en: 'before/after, causality' }, { zh: '时刻表、git log', en: 'timetable, git log' }, { zh: '时间轴/甘特', en: 'timeline/Gantt' }],
            [{ zh: '连续性', en: 'continuous' }, { zh: '两点之间总有时间', en: 'points exist between' }, { zh: '传感器流、心率', en: 'sensor stream, HR' }, { zh: '连续折线/面积', en: 'line/area' }],
            [{ zh: '周期性', en: 'periodic' }, { zh: '季节、昼夜循环', en: 'seasons, day-night' }, { zh: '月气温、24h 体温', en: 'monthly temp, 24h' }, { zh: '螺旋/日历/极坐标', en: 'spiral/calendar' }],
            [{ zh: '独立于空间', en: 'space-independent' }, { zh: '时间不与空间混码', en: 'do not mix with space' }, { zh: '多城市对比', en: 'compare cities' }, { zh: '小倍数分面', en: 'small multiples' }],
            [{ zh: '结构性', en: 'structured' }, { zh: '年/月/周/日、工作日', en: 'calendar units, workdays' }, { zh: '周末出行、闰年', en: 'weekend, leap year' }, { zh: '日历格子', en: 'calendar layout' }]
          ] },
        { t: 'list', x: [
          { zh: '忽略有序性：把乱序数据画成散点，会被当成噪声', en: 'Ignoring order: unordered points read as noise' },
          { zh: '混淆连续性：给离散事件硬连连续线，会暗示不存在的中间值', en: 'Confusing continuity: connecting discrete events implies phantom values' },
          { zh: '忽略周期性：季节趋势被普通折线"抹平"', en: 'Ignoring periodicity: a plain line flattens seasonal cycles' },
          { zh: '结构不匹配：周末/工作日、闰年的格子错位', en: 'Structure mismatch: weekends and leap years misalign' }
        ] },
        { t: 'demo', id: 'd05-1', title: { zh: '场景拖拽分类', en: 'Drag scenarios into attributes' },
          x: { zh: '把 8 个真实场景拖到最依赖的属性上：放对解锁推荐图，放错展示"据此选错属性会画出什么错误图"。', en: 'Drag 8 scenarios onto their key attribute: correct placements unlock the recommended chart, wrong ones show the misleading chart.' } }
      ]
    },
    {
      id: '5.2',
      title: { zh: '标准时间可视化：折线图', en: 'Standard: The Line Chart' },
      sub: { zh: 'x = 时间、y = 度量；线性时间域看趋势', en: 'x = time, y = measure; linear domain shows trend' },
      blocks: [
        { t: 'p', x: { zh: '标准时序图是二维线图，<code>d3.scaleTime</code> 把 Date 对象映射到 x，ticks 自动按"年/月/日"分组。它在<strong>线性时间域</strong>里读趋势最直观，但不擅长表达周期，因此需要 5.3、5.4 的布局。', en: 'A standard temporal chart is a 2D line; <code>d3.scaleTime</code> maps Date objects to x and ticks group by year/month/day. It reads trend well in a linear domain but not periodicity, hence the layouts in 5.3–5.4.' } },
        { t: 'code', lang: 'js', title: { zh: '① scaleTime 与时间线', en: '① scaleTime and the line' },
          code: `const x = d3.scaleTime()
  .domain(d3.extent(data, d => d.date))
  .range([0, width]);
const line = d3.line().x(d => x(d.date)).y(d => y(d.count));
// brush 框选年代：放大主图 x 域
const brush = d3.brushX().extent([[0,0],[w,h]]).on('end', e => {
  if (e.selection) x.domain(e.selection.map(bx.invert));
  // 归一化：除以各自峰值，消除规模差异，比形态
});`,
          notes: [
            { type: 'why', h: { zh: '绝对 vs 归一化', en: 'Absolute vs normalized' },
              x: { zh: '绝对人数比总量；把每条线除以自己的峰值（归一化），能消除规模差异、只比较"份额"与形态。', en: 'Absolute counts compare volume; dividing each line by its peak (normalization) removes scale to compare shape and share.' } }
          ] },
        { t: 'tip', title: { zh: '点数与曲线', en: 'Points and curves' },
          x: { zh: '点数 ≤ 50 用 linear 直连，50–500 用 monotoneX 平滑且不伪震荡，点很多再考虑面积；数据新闻标配 hover 提示 + 刷选缩放。', en: 'Use linear for ≤50 points, monotoneX for 50–500 (smooth without artifacts), and area for many points; data journalism pairs hover tips with brush zoom.' } },
        { t: 'demo', id: 'd05-2', title: { zh: '人名流行度播放 + brush 缩放', en: 'Name popularity play + brush zoom' },
          x: { zh: '三个法国名字 1900–2020 逐年生长，在下方条带框选年代放大，可切归一化/面积，峰值年代有标注。', en: 'Three French names grow year by year 1900–2020; brush the strip to zoom, toggle normalized/area, with peak-era annotations.' } }
      ]
    },
    {
      id: '5.3',
      title: { zh: '日历热图（van Wijk）', en: 'Calendar Heatmap' },
      sub: { zh: 'x = 年内第几周、y = 星期几、颜色 = 数值', en: 'x = week of year, y = weekday, color = value' },
      blocks: [
        { t: 'p', x: { zh: 'van Wijk 2008 提出的日历热图把一年铺成 53 周 × 7 天的网格：颜色编码数值，横向看季节、纵向看周内规律，特别适合发现<strong>全年异常、空窗与节假日/周末效应</strong>。', en: 'Van Wijk’s (2008) calendar heatmap lays a year on a 53×7 grid: color encodes value, columns reveal seasons and rows weekday patterns, ideal for spotting anomalies, gaps and holiday/weekend effects.' } },
        { t: 'list', x: [
          { zh: '年历：发现全年异常、连续空窗、季节趋势', en: 'Year: yearly anomalies, gaps, seasonality' },
          { zh: '12 个月小倍数：逐月对比，避免长条形压扁', en: '12 month multiples: month-to-month comparison' },
          { zh: '星期×月循环：聚合后同时暴露"周内"与"季节"两类周期', en: 'Weekday×month: unfolds weekly and seasonal cycles' },
          { zh: '配色用顺序型 colormap（Viridis/Blues），温度等双向量可用 RdBu', en: 'Use sequential colormaps (Viridis/Blues), diverging RdBu for temperature' }
        ] },
        { t: 'key', title: { zh: '月分隔判定', en: 'Month divider' }, body: [
          { t: 'p', x: { zh: '判断某格与 7 天前的格是否同月：同月则连续，否则在两者之间画月线。这是日历布局对齐月份的核心算法。', en: 'Compare a cell’s month with the cell 7 days before: if they differ, draw a month boundary between them — the core calendar alignment trick.' } }
        ] },
        { t: 'demo', id: 'd05-3', title: { zh: '三种日历布局联动', en: 'Three calendar layouts linked' },
          x: { zh: '同一份 2024 气温/降雨，在年历、12 月小倍数、星期×月循环间切换，选配色、高亮周末，体会不同布局暴露不同周期。', en: 'The same 2024 temperature/rain across year, month multiples and weekday×month, with colormap choice and weekend highlighting.' } }
      ]
    },
    {
      id: '5.4',
      title: { zh: '周期时间：阿基米德螺旋', en: 'Periodic: Archimedean Spiral' },
      sub: { zh: 'r = a + bθ；每转一圈代表一个周期', en: 'r = a + bθ; each revolution is one period' },
      blocks: [
        { t: 'p', x: { zh: '螺旋 = 圆 + 持续展开。设<strong>每圈代表一个周期</strong>，则同相位（同季节、同相位角）的点会落在同一角度，沿半径堆叠成放射臂——周期被"拉直"，一眼可见。折线擅长趋势，螺旋擅长重复。', en: 'A spiral is a circle plus expansion. Set one revolution per period and same-phase points share an angle, stacking into radial arms — the period is straightened. Lines read trend; spirals read repetition.' } },
        { t: 'code', lang: 'js', title: { zh: '① 螺旋坐标', en: '① Spiral coordinates' },
          code: `// 第 i 个点，每圈 P 天
const r = r0 + k * i;
const theta = 2 * Math.PI * i / P - Math.PI / 2;
const px = cx + r * Math.cos(theta);
const py = cy + r * Math.sin(theta);
// P 与数据真实周期对齐时，同相位沿半径排成放射线`,
          notes: [
            { type: 'warn', h: { zh: '什么时候不适用', en: 'When not to use' },
              x: { zh: '数据没有周期、或周期远长于全部数据时，螺旋会是一团乱麻；此时应回到线性时间轴。', en: 'With no period, or a period far longer than the data, the spiral becomes a tangle; return to a linear timeline.' } }
          ] },
        { t: 'demo', id: 'd05-4', title: { zh: '螺旋/直线对照 + 周期可调', en: 'Spiral/linear with adjustable period' },
          x: { zh: '调节每圈 7/30/91/365 天，对比真实气温（1 年）与理想正弦（3 年）：周期对齐时同相位点沿半径排成放射臂。', en: 'Set 7/30/91/365 days per revolution for real temperature (1 yr) or an ideal sine (3 yr); when aligned, same-phase points form radial arms.' } }
      ]
    },
    {
      id: '5.5',
      title: { zh: 'Storyline 时间线', en: 'Storyline Timelines' },
      sub: { zh: '每条线 = 一个角色；y 距离 = 聚散关系', en: 'Each line = a character; y-distance = relationship' },
      blocks: [
        { t: 'p', x: { zh: 'Ogawa & Ma（2008）的 Storyline 把每个角色/组织/进程抽象成一条"生命线"：<strong>线靠近 = 同框相遇/冲突，线分开 = 角色分离</strong>。时间严格按比例映到 x，样条沿时间流动，事件层标注关键转折。', en: 'Ogawa & Ma (2008) abstract each entity into a lifeline: lines converge when characters meet and diverge when apart. Time maps proportionally to x, splines flow with time, and an event layer marks turning points.' } },
        { t: 'list', x: [
          { zh: '时间尺度映射：时长按比例映到宽度，x 严格对齐', en: 'Time mapping: duration maps proportionally to width' },
          { zh: 'Catmull-Rom 样条：张力 0.5 兼顾"河流感"与不震荡', en: 'Catmull-Rom spline: alpha 0.5 for flow without wobble' },
          { zh: '事件层：标记相遇/冲突等关键转折点', en: 'Event layer: marks meetings and conflicts' },
          { zh: '重排车道减少交叉，让主线更清晰', en: 'Reorder lanes to cut crossings and foreground the main thread' }
        ] },
        { t: 'theory', title: { zh: 'Storyline vs Alluvial/桑基', en: 'Storyline vs Alluvial/Sankey' }, body: [
          { t: 'p', x: { zh: 'Storyline 用连续的 y 距离表达关系亲疏，关系随时间平滑变化；Alluvial/桑基把时间切成离散阶段，用连接带表达成员在阶段之间的流转。前者看"关系曲线"，后者看"成员构成"。', en: 'Storyline expresses closeness by continuous y-distance varying smoothly; Alluvial/Sankey cuts time into discrete stages and uses ribbons to show membership flow. One shows relationship curves, the other stage membership.' } }
        ] },
        { t: 'pit', title: { zh: '为什么不用 monotoneX', en: 'Why not monotoneX' },
          x: { zh: 'monotoneX 不过冲但线条偏直，失去叙事的"河流感"；Catmull-Rom 张力 0.5 是经验值，流动而不震荡。', en: 'monotoneX avoids overshoot but looks stiff and loses the narrative “river”; Catmull-Rom alpha 0.5 flows without wobbling.' } },
        { t: 'demo', id: 'd05-5', title: { zh: '拖拽车道 + Storyline/Alluvial', en: 'Draggable lanes + Storyline/Alluvial' },
          x: { zh: '《侏罗纪公园》五条角色线可拖拽重排，相遇聚拢、点事件看剧情；切 Alluvial 看角色在四幕间的流转。', en: 'Five Jurassic Park lines can be reordered by dragging, converge at meetings, and click events reveal plot; switch to Alluvial for flow across four acts.' } }
      ]
    }
  ],
  summary: {
    zh: [
      '时间有有序、连续、周期、独立于空间、结构五个属性，它们决定图表选择（时间轴/折线/螺旋/小倍数/日历）。',
      '标准折线用 scaleTime 把时间映到 x，线性域看趋势最直观；绝对数比总量，归一化比形态。',
      '日历热图把一年铺成 53×7 网格，年历看异常、月小倍数看逐月、星期×月看周内与季节，注意月分隔与周末。',
      '阿基米德螺旋令每圈=一个周期，同相位点沿半径排成放射臂；周期不对齐则失效，无周期用回线性轴。',
      'Storyline 以 y 距离表达关系亲疏，三要素为时间映射、Catmull-Rom 样条与事件层；离散阶段流转改用 Alluvial/桑基。'
    ],
    en: [
      'Time has five attributes—ordered, continuous, periodic, space-independent, structured—that drive chart choice (timeline/line/spiral/small multiples/calendar).',
      'The line chart maps time to x with scaleTime and reads trend in a linear domain; absolute counts compare volume, normalization compares shape.',
      'The calendar heatmap lays a year on a 53×7 grid; the year view finds anomalies, month multiples compare months, weekday×month shows weekly and seasonal cycles.',
      'An Archimedean spiral sets one revolution per period so same-phase points form radial arms; mismatched periods break it and aperiodic data needs a linear axis.',
      'Storyline encodes relationship by y-distance via time mapping, Catmull-Rom splines and an event layer; discrete stage flow uses Alluvial/Sankey.'
    ]
  },
  quickref: [
    { tag: '5.1', x: { zh: '① 有序 ② 连续 ③ 周期 ④ 独立空间 ⑤ 结构 → 选图', en: '① ordered ② continuous ③ periodic ④ space ⑤ structured → chart' } },
    { tag: '5.2', x: { zh: '① scaleTime ② 折线 ③ brush ④ 归一化 ⑤ 单调曲线', en: '① scaleTime ② line ③ brush ④ normalize ⑤ monotone' } },
    { tag: '5.3', x: { zh: '① 53×7 ② 年历/月/循环 ③ 顺序配色 ④ 月分隔 ⑤ 周末', en: '① 53×7 ② year/month/cycle ③ sequential ④ divider ⑤ weekend' } },
    { tag: '5.4', x: { zh: '① r=a+bθ ② 每圈一周期 ③ 放射臂 ④ 无周期别用', en: '① r=a+bθ ② 1 rev/period ③ radial arms ④ no period = no' } },
    { tag: '5.5', x: { zh: '① 生命线 ② y=关系 ③ Catmull-Rom ④ 事件层 ⑤ vs Alluvial', en: '① lifelines ② y=relation ③ Catmull-Rom ④ events ⑤ vs Alluvial' } }
  ],
  quiz: [
    { q: { zh: '一段数据在普通折线图里看不到明显规律，却在日历热图里呈现强烈的周内/季节模式，为什么？', en: 'A series shows little pattern in a line chart but strong weekly/seasonal patterns in a calendar heatmap. Why?' },
      a: { zh: '普通折线沿线性时间走，周期性信号被趋势"摊平"；日历热图把"第几周/星期几"作为显式坐标，把同相位的日子折叠到同一格，周内与季节周期因而显现。', en: 'A linear line spreads periodic signals across trend; the calendar makes week-of-year and weekday explicit coordinates, folding same-phase days into the same cell so cycles surface.' } },
    { q: { zh: '把"离散提交的 git log"用连续曲线连起来、把"逐秒心率"画成一根根互不相连的柱子，分别犯了什么错？', en: 'What is wrong with connecting a discrete git log with a continuous curve and plotting per-second heart rate as disconnected bars?' },
      a: { zh: 'git 提交是离散事件，连续线会暗示两次提交之间存在不存在的中间值（混淆连续性）；心率是连续量，断成柱子会抹掉两点之间仍有取值这一事实，丢失连续变化。应分别用时间轴/阶梯与连续折线。', en: 'Commits are discrete, so a continuous curve implies phantom values between them (confusing continuity); heart rate is continuous, so breaking it into bars erases values between samples. Use a timeline/step for commits and a continuous line for heart rate.' } },
    { q: { zh: '阿基米德螺旋在什么设置下能让同季节点排成放射臂？为什么？', en: 'When does an Archimedean spiral align same-season points into radial arms, and why?' },
      a: { zh: '当每圈代表的周期（如 365 天）与数据真实周期相等时：同相位点（同季节）在每一圈都落在同一角度，于是沿半径堆叠成放射臂。周期不对齐时同相位点逐圈漂移，就看不到放射臂。', en: 'When one revolution equals the true period (e.g. 365 days): same-phase points share the same angle on every turn and stack radially into arms. With a mismatch they drift across turns and no arms appear.' } },
    { q: { zh: 'Storyline 里"线靠近"代表什么？它和 Alluvial/桑基在表达上有何不同？', en: 'What does line proximity mean in a Storyline, and how does it differ from Alluvial/Sankey?' },
      a: { zh: '线靠近代表角色在同一时间同框、相遇或冲突；线分开代表分离。Storyline 用连续的 y 距离表达关系随时间的平滑变化；Alluvial/桑基把时间切成离散阶段，用连接带表示成员在阶段之间的流转。', en: 'Proximity means characters share a scene, meet or clash; separation means they are apart. Storyline uses continuous y-distance for smoothly varying relationships, while Alluvial/Sankey cuts time into discrete stages and ribbons membership flow.' } },
    { q: { zh: '比较 Marie、Jean、Camille 三个名字的形态时，为什么要把各自峰值归一化到 100%？', en: 'Why normalize each name’s peak to 100% when comparing Marie, Jean and Camille?' },
      a: { zh: '绝对人数同时受规模（总登记数）影响，峰值高的名字会盖住其它线；归一化除以各自峰值，消除规模差异，只比较"何时流行、如何起落"的形态与相对份额。', en: 'Absolute counts confound shape with total scale, so a dominant name hides the others; dividing by each peak removes scale, comparing timing and the rise/fall shape or relative share.' } }
  ]
};
